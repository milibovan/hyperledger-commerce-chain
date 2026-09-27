# install.packages("sparklyr")
# install.packages("DBI")
# install.packages("dplyr")
# install.packages("ggplot2")
# install.packages("dbplot")
# install.packages("scales")
# install.packages("sparkxgb")
# install.packages("xgboost")
# install.packages("rmarkdown")

path <- "file:///C:/Users/MiliBovan/Desktop/master/hyperledger-commerce-chain/analytics/data-generator"

library(sparklyr)
library(DBI)
library(dplyr)
library(ggplot2)
library(dbplot)
library(scales)
library(sparkxgb)

config <- spark_config()

config$spark.driver.memory <- "10g"
config$spark.executor.memory <- "10g"
config$spark.driver.extraJavaOptions <- "-Xms4g -Xmx10g -XX:+UseG1GC -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED"
config$spark.executor.cores <- 16

config$spark.memory.fraction <- "0.6"

Sys.setenv(HADOOP_HOME = "C:/Hadoop")

sc <- spark_connect(master = "local[*]", version = "3.3", config = config)

spark_session(sc) %>%
  invoke("conf") %>%
  invoke("set", "spark.sql.shuffle.partitions", "32")

spark_session(sc) %>%
  invoke("sparkContext") %>%
  invoke("setCheckpointDir", "/tmp/spark_checkpoints")

show_missing_values <- function(spark_df) {
  na_table <- spark_df %>%
    summarise(across(everything(), ~sum(as.integer(is.na(.))))) %>%
    collect()

  show_na <- data.frame(
    Column = colnames(na_table),
    No_NA = as.numeric(na_table[1,])
  )

  show_na
}

load_and_inspect <- function(sc, name, path) {
  df <- spark_read_csv(sc, name, path)

  cat("\n=== ", toupper(name), " ===\n")
  cat("Columns:", paste(colnames(df), collapse = ", "), "\n\n")

  glimpse(df)

  na_summary <- show_missing_values(df)
  na_summary$Total_Rows <- sdf_nrow(df)
  na_summary$Pct_Missing <- round(100 * na_summary$No_NA / na_summary$Total_Rows, 2)

  print(na_summary)

  df
}

orders <- load_and_inspect(sc, "orders", paste0(path, "/orders.csv"))
products <- load_and_inspect(sc, "products", paste0(path, "/products.csv"))
receipts <- load_and_inspect(sc, "receipts", paste0(path, "/receipts.csv"))
traders <- load_and_inspect(sc, "traders", paste0(path, "/traders.csv"))
users <- load_and_inspect(sc, "users", paste0(path, "/users.csv"))

order_products <- load_and_inspect(sc, "order_products", paste0(path, "/order_products.csv"))
receipt_products <- load_and_inspect(sc, "receipt_products", paste0(path, "/receipt_products.csv"))
trader_products <- load_and_inspect(sc, "trader_products", paste0(path, "/trader_products.csv"))

# Plot missing values
all_entities <- list(
  users = users, traders = traders, products = products,
  orders = orders, receipts = receipts,
  order_products = order_products,
  receipt_products = receipt_products,
  trader_products = trader_products
)

missing_summary <- bind_rows(lapply(names(all_entities), function(nm) {
  df <- show_missing_values(all_entities[[nm]])
  df$Entity <- nm
  df$Pct_Missing <- round(100 * df$No_NA / sdf_nrow(all_entities[[nm]]), 2)
  df
}))

missing_summary <- missing_summary %>% filter(No_NA > 0)

ggplot(missing_summary, aes(x = reorder(paste(Entity, Column, sep = "."), Pct_Missing),
                            y = Pct_Missing, fill = Entity)) +
  geom_col() +
  coord_flip() +
  labs(title = "Percentage of missing columns",
       x = "Entity.Column", y = "% NA") +
  theme_minimal()

# ---------------------------------------------------------------------------
# Cleaning data
#
# CHANGE: columns whose missingness is *informative* / tied to the outcome
# (lead_days, expected_fulfillment_date, cancelled_date, cancelled_by,
# expiry_date) are now protected from the generic drop/median-fill logic.
# Dropping rows based on lead_days used to silently delete a disproportionate
# share of CANCELLED/PENDING orders (their missingness is directly caused by
# status in the generator), which quietly worsened class imbalance and
# biased the training set. These columns now get explicit, non-destructive
# handling and rows are never dropped because of them.
# ---------------------------------------------------------------------------
clean_data <- function(spark_df, df_name) {
  na_table <- spark_df %>%
    summarise(across(everything(), ~sum(as.integer(is.na(.))))) %>%
    collect()

  total_rows <- sdf_nrow(spark_df)
  if (total_rows == 0) return(spark_df)

  na_summary <- data.frame(
    Column = colnames(na_table),
    No_NA = as.numeric(na_table[1,]),
    Pct_Missing = round(100 * as.numeric(na_table[1,]) / total_rows, 2)
  )

  protected_cols <- c("lead_days", "expected_fulfillment_date",
                       "cancelled_date", "cancelled_by", "expiry_date")

  cols_to_drop <- na_summary %>%
    filter(Pct_Missing > 0 & Pct_Missing < 15 & !(Column %in% protected_cols)) %>%
    pull(Column)
  cols_to_fill <- na_summary %>%
    filter(Pct_Missing >= 15 & !(Column %in% protected_cols)) %>%
    pull(Column)

  cleaned_df <- spark_df
  col_types <- sdf_schema(cleaned_df)

  if (length(cols_to_drop) > 0) {
    for (col in cols_to_drop) {
      cleaned_df <- cleaned_df %>% filter(!is.na(!!sym(col)))
    }
  }

  if (length(cols_to_fill) > 0) {
    for (col in cols_to_fill) {
      col_type <- col_types[[col]]$type
      if (col_type %in% c("DoubleType", "IntegerType", "LongType", "FloatType")) {
        med_val <- cleaned_df %>%
          filter(!is.na(!!sym(col))) %>%
          summarise(m = percentile_approx(!!sym(col), 0.5)) %>%
          collect() %>%
          pull(m)
        cleaned_df <- cleaned_df %>%
          mutate(!!sym(col) := ifelse(is.na(!!sym(col)), med_val, !!sym(col)))
      } else if (col_type %in% c("TimestampType", "DateType")) {
        cleaned_df <- cleaned_df
      } else {
        cleaned_df <- cleaned_df %>%
          mutate(!!sym(col) := ifelse(is.na(!!sym(col)), "Unknown", !!sym(col)))
      }
    }
  }

  # Protected columns: explicit handling, never row-dropped
  if ("cancelled_date" %in% colnames(cleaned_df)) {
    cleaned_df <- cleaned_df %>%
      mutate(cancelled_date = ifelse(is.na(cancelled_date), "Not Cancelled", as.character(cancelled_date)))
  }
  if ("cancelled_by" %in% colnames(cleaned_df)) {
    cleaned_df <- cleaned_df %>%
      mutate(cancelled_by = ifelse(is.na(cancelled_by), "Not Cancelled", as.character(cancelled_by)))
  }
  if ("expiry_date" %in% colnames(cleaned_df)) {
    cleaned_df <- cleaned_df %>%
      mutate(expiry_date = ifelse(is.na(expiry_date), "No Expiry Date", as.character(expiry_date)))
  }
  if ("lead_days" %in% colnames(cleaned_df) && "trader_type" %in% colnames(cleaned_df)) {
    # Median lead time computed PER trader_type (fulfillment time is
    # inherently trader-type dependent - a CARDEALER order and a GROCERY
    # order don't share a sensible global median), rather than one
    # dataset-wide median.
    # NOTE: percentile_approx isn't a function dbplyr recognizes as a true
    # aggregate. Left lazy, dbplyr's query-simplification can merge this
    # group_by/summarise into the outer join/mutate and drop the GROUP BY
    # entirely, producing "grouping expressions sequence is empty". Forcing
    # collect() here (only ~a handful of trader_type rows) materializes the
    # medians locally first, then copies that tiny table back to Spark for
    # the join - avoiding the ambiguous lazy-SQL nesting altogether.
    trader_type_medians <- cleaned_df %>%
      filter(!is.na(lead_days)) %>%
      group_by(trader_type) %>%
      summarise(lead_days_median = percentile_approx(lead_days, 0.5)) %>%
      collect()

    cleaned_df <- cleaned_df %>%
      left_join(trader_type_medians, by = "trader_type", copy = TRUE) %>%
      mutate(lead_days = ifelse(is.na(lead_days), lead_days_median, lead_days)) %>%
      select(-lead_days_median)
  }

  sdf_persist(cleaned_df, storage.level = "MEMORY_AND_DISK")
}

users_cleaned <- clean_data(users, "users")
traders_cleaned <- clean_data(traders, "traders")
products_cleaned <- clean_data(products, "products")

orders_cleaned <- clean_data(orders, "orders") %>%
  inner_join(users_cleaned %>% select(id), by = c("user_id" = "id")) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

receipts_cleaned <- clean_data(receipts, "receipts") %>%
  inner_join(orders_cleaned %>% select(id), by = c("order_id" = "id")) %>%
  inner_join(traders_cleaned %>% select(id), by = c("trader_id" = "id")) %>%
  inner_join(users_cleaned %>% select(id), by = c("user_id" = "id")) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

order_products_cleaned <- clean_data(order_products, "order_products") %>%
  inner_join(orders_cleaned %>% select(id), by = c("order_id" = "id")) %>%
  inner_join(products_cleaned %>% select(id), by = c("product_id" = "id")) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

receipt_products_cleaned <- clean_data(receipt_products, "receipt_products") %>%
  inner_join(receipts_cleaned %>% select(id), by = c("receipt_id" = "id")) %>%
  inner_join(products_cleaned %>% select(id), by = c("product_id" = "id")) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

trader_products_cleaned <- clean_data(trader_products, "trader_products") %>%
  inner_join(traders_cleaned %>% select(id), by = c("trader_id" = "id")) %>%
  inner_join(products_cleaned %>% select(id), by = c("product_id" = "id")) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

# Cleaning summary
# for (nm in c("users", "traders", "products", "orders", "receipts",
#              "order_products", "receipt_products", "trader_products")) {
#   orig <- get(nm)
#   cleaned <- get(paste0(nm, "_cleaned"))
#   cat(sprintf("%-20s %10d -> %10d rows (%.2f%% retained)\n",
#               nm, sdf_nrow(orig), sdf_nrow(cleaned),
#               100 * sdf_nrow(cleaned) / sdf_nrow(orig)))
# }

# Showing columns and types
# show_columns <- function(data) {
#   cols <- sdf_schema(data)
#   for (col in cols) {
#     cat("Name: ", col[[1]], "\t", "Type: ", col[[2]], "\n")
#   }
# }
#
# show_columns(users_cleaned)
# show_columns(traders_cleaned)
# show_columns(products_cleaned)
#
# show_columns(orders_cleaned)
# show_columns(receipts_cleaned)
# show_columns(order_products_cleaned)
# show_columns(receipt_products_cleaned)
# show_columns(trader_products_cleaned)

# Data analysis and visualization
# analyze_boolean <- function(spark_df, col_name) {
#   total_rows <- sdf_nrow(spark_df)
#
#   counts_df <- spark_df %>%
#     group_by(!!sym(col_name)) %>%
#     summarise(Frequency = n()) %>%
#     collect()
#
#   counts_df$Pct <- round(100 * counts_df$Frequency / total_rows, 2)
#
#   colnames(counts_df)[1] <- "Value"
#
#   p <- ggplot(counts_df, aes(x = factor(Value), y = Pct, fill = factor(Value))) +
#     geom_col() +
#     geom_text(aes(label = paste0(Pct, "%")), vjust = -0.3) +
#     labs(title = paste("orders_cleaned -", col_name),
#          x = col_name,
#          y = "Percentage (%)") +
#     theme_minimal() +
#     theme(legend.position = "none")
#
#   print(p)
#
#   print(counts_df)
#
#   counts_df
# }
#
# analyze_string <- function(spark_df, col_name, top_n = 5, is_id_like = FALSE) {
#   total_rows <- sdf_nrow(spark_df)
#
#   cardinality <- spark_df %>%
#     summarise(n_distinct = n_distinct(!!sym(col_name))) %>%
#     pull(n_distinct)
#
#   top_n_df <- spark_df %>%
#     group_by(!!sym(col_name)) %>%
#     summarise(Frequency = n()) %>%
#     arrange(desc(Frequency)) %>%
#     head(top_n) %>%
#     collect()
#
#   top_n_df$Pct_Of_Total <- round(100 * top_n_df$Frequency / total_rows, 2)
#   colnames(top_n_df)[1] <- "Value"
#
#   print(top_n_df)
#
#   if (is_id_like) {
#     duplicates <- total_rows - cardinality
#
#     dup_examples <- spark_df %>%
#       group_by(!!sym(col_name)) %>%
#       summarise(Count = n()) %>%
#       filter(Count > 1) %>%
#       arrange(desc(Count)) %>%
#       head(5) %>%
#       collect()
#
#     print(dup_examples)
#   }
#   should_plot <- !is_id_like && sum(top_n_df$Pct_Of_Total) >= 1
#
#   if (should_plot) {
#     p <- ggplot(top_n_df, aes(x = reorder(Value, Frequency), y = Pct_Of_Total)) +
#       geom_col(fill = "steelblue") +
#       geom_text(aes(label = paste0(Pct_Of_Total, "%")), hjust = -0.1) +
#       coord_flip() +
#       labs(title = paste("Top", top_n, "-", col_name),
#            x = col_name, y = "Percentage (%)") +
#       theme_minimal()
#
#     print(p)
#   }
#
#   invisible(list(cardinality = cardinality, top_n = top_n_df))
# }
#
# analyze_numeric <- function(spark_df, col_name) {
#   stats <- spark_df %>%
#     summarise(
#       Min = min(!!sym(col_name)),
#       Max = max(!!sym(col_name)),
#       Average = mean(!!sym(col_name)),
#       Std_Dev = sd(!!sym(col_name)),
#
#       Median = percentile_approx(!!sym(col_name), 0.5),
#
#       Quantile_25 = percentile_approx(!!sym(col_name), 0.25),
#       Quantile_75 = percentile_approx(!!sym(col_name), 0.75)
#     ) %>%
#     collect()
#
#   data <- data.frame(
#     Metrics = colnames(stats),
#     Value = as.numeric(stats[1,])
#   )
#
#   if (is.finite(stats$Min[1]) &&
#     is.finite(stats$Max[1]) &&
#     stats$Max[1] > stats$Min[1]) {
#     n_bins <- 30
#     splits <- seq(stats$Min[1], stats$Max[1], length.out = n_bins + 1)
#     splits[1] <- -Inf
#     splits[length(splits)] <- Inf
#
#     binned <- spark_df %>%
#       filter(!is.na(!!sym(col_name))) %>%
#       ft_bucketizer(input_col = col_name, output_col = "bucket", splits = splits) %>%
#       group_by(bucket) %>%
#       summarise(count = n()) %>%
#       collect() %>%
#       arrange(bucket)
#
#     binned$bin_center <- (splits[binned$bucket + 1] + splits[binned$bucket + 2]) / 2
#     binned$bin_center[binned$bucket == 0] <- stats$Min[1]
#     binned$bin_center[binned$bucket == n_bins - 1] <- stats$Max[1]
#
#     p_hist <- ggplot(binned, aes(x = bin_center, y = count)) +
#       geom_col(fill = "steelblue", width = (stats$Max[1] - stats$Min[1]) / n_bins * 0.9) +
#       labs(title = paste("Distribucija -", col_name),
#            x = col_name, y = "Broj zapisa") +
#       theme_minimal()
#
#     print(p_hist)
#   }
#
#   box_df <- data.frame(
#     x = col_name,
#     ymin = stats$Min[1],
#     lower = stats$Quantile_25[1],
#     middle = stats$Median[1],
#     upper = stats$Quantile_75[1],
#     ymax = stats$Max[1]
#   )
#
#   p_box <- ggplot(box_df, aes(x = x)) +
#     geom_boxplot(aes(ymin = ymin, lower = lower, middle = middle, upper = upper, ymax = ymax),
#                  stat = "identity", fill = "lightblue") +
#     labs(title = paste("Boxplot -", col_name), x = "", y = col_name) +
#     theme_minimal()
#
#   print(p_box)
#
#   print(data)
# }
#
# analyze_timestamp <- function(spark_df, col_name) {
#   stats <- spark_df %>%
#     summarise(
#       Min = min(!!sym(col_name), na.rm = TRUE),
#       Max = max(!!sym(col_name), na.rm = TRUE)
#     ) %>%
#     collect()
#
#   min_date <- stats$Min[1]
#   max_date <- stats$Max[1]
#   day_span <- as.numeric(difftime(max_date, min_date, units = "days"))
#
#   data <- data.frame(
#     Metrics = c("Min", "Max", "Span (days)"),
#     Value = c(as.character(min_date), as.character(max_date), round(day_span, 1))
#   )
#
#   monthly <- spark_df %>%
#     filter(!is.na(!!sym(col_name))) %>%
#     mutate(year_month = date_format(!!sym(col_name), "yyyy-MM")) %>%
#     group_by(year_month) %>%
#     summarise(count = n()) %>%
#     arrange(year_month) %>%
#     collect()
#
#   p <- ggplot(monthly, aes(x = year_month, y = count, group = 1)) +
#     geom_line(color = "steelblue") +
#     geom_point(color = "steelblue") +
#     labs(title = paste("Broj zapisa po mesecu -", col_name),
#          x = "Godina-Mesec", y = "Broj zapisa") +
#     theme_minimal() +
#     theme(axis.text.x = element_text(angle = 90, hjust = 1))
#
#   print(p)
#
#   print(data)
#
#   invisible(list(min = min_date, max = max_date, range_days = day_span))
# }
#
# analyze_and_visualize <- function(data) {
#   cols <- sdf_schema(data)
#   for (col in cols) {
#     cat("Name: ", col[[1]], "\t", "Type: ", col[[2]], "\n")
#     if (col[[2]] == "BooleanType") {
#       plot_df <- analyze_boolean(data, col[[1]])
#     } else if (col[[2]] == "StringType") {
#       is_id <- grepl("id", col[[1]], ignore.case = TRUE)
#       analyze_string(data, col[[1]], top_n = 5, is_id_like = is_id)
#     } else if (col[[2]] == "DoubleType" ||
#       col[[2]] == "IntegerType" ||
#       col[[2]] == "LongType") {
#       analyze_numeric(data, col[[1]])
#     } else if (col[[2]] == "TimestampType") {
#       analyze_timestamp(data, col[[1]])
#     }
#   }
# }
#
# analyze_and_visualize(users_cleaned)
# analyze_and_visualize(traders_cleaned)
# analyze_and_visualize(products_cleaned)
#
# analyze_and_visualize(orders_cleaned)
# analyze_and_visualize(receipts_cleaned)
# analyze_and_visualize(order_products_cleaned)
# analyze_and_visualize(receipt_products_cleaned)
# analyze_and_visualize(trader_products_cleaned)
#
# analyze_trader_lead_days <- function(spark_df) {
#   summary_data <- spark_df %>%
#     filter(!is.na(trader_type) & !is.na(lead_days)) %>%
#     group_by(trader_type) %>%
#     summarise(mean_lead_days = mean(lead_days, na.rm = TRUE)) %>%
#     collect()
#
#   print(summary_data)
#
#   ggplot(summary_data, aes(x = trader_type, y = mean_lead_days, fill = trader_type)) +
#     geom_bar(stat = "identity", show.legend = FALSE) +
#     theme_minimal() +
#     labs(
#       title = "Average Lead Days by Trader Type",
#       x = "Trader Type",
#       y = "Mean Lead Days"
#     ) +
#     theme(axis.text.x = element_text(angle = 45, hjust = 1))
# }
#
# analyze_status_total_cost <- function(spark_df) {
#   summary_data <- spark_df %>%
#     filter(!is.na(status) & !is.na(total_cost)) %>%
#     group_by(status) %>%
#     summarise(mean_total_cost = mean(total_cost, na.rm = TRUE)) %>%
#     collect()
#
#   print(summary_data)
#
#   ggplot(summary_data, aes(x = status, y = mean_total_cost, fill = status)) +
#     geom_bar(stat = "identity", show.legend = FALSE) +
#     theme_minimal() +
#     labs(
#       title = "Average Total Cost by Order Status",
#       x = "Order Status",
#       y = "Mean Total Cost"
#     )
# }
#
# analyze_trader_status_distribution <- function(spark_df) {
#   summary_data <- spark_df %>%
#     filter(!is.na(trader_type) & !is.na(status)) %>%
#     group_by(trader_type, status) %>%
#     count() %>%
#     collect()
#
#   print(summary_data)
#
#   ggplot(summary_data, aes(x = trader_type, y = n, fill = status)) +
#     geom_bar(stat = "identity", position = "fill") +
#     scale_y_continuous(labels = scales::percent) +
#     theme_minimal() +
#     labs(
#       title = "Order Status Distribution by Trader Type",
#       x = "Trader Type",
#       y = "Percentage Share",
#       fill = "Order Status"
#     ) +
#     theme(axis.text.x = element_text(angle = 45, hjust = 1))
# }
#
# analyze_num_products_status <- function(spark_df) {
#   summary_data <- spark_df %>%
#     filter(!is.na(num_products) & !is.na(status)) %>%
#     group_by(num_products, status) %>%
#     count() %>%
#     collect()
#
#   print(summary_data)
#
#   ggplot(summary_data, aes(x = factor(num_products), y = n, fill = status)) +
#     geom_bar(stat = "identity", position = "fill") +
#     scale_y_continuous(labels = scales::percent) +
#     theme_minimal() +
#     labs(
#       title = "Order Status Breakdown by Number of Products",
#       x = "Number of Products in Order",
#       y = "Percentage Share",
#       fill = "Order Status"
#     )
# }
#
# analyze_trader_total_cost <- function(spark_df) {
#   summary_data <- spark_df %>%
#     filter(!is.na(trader_type) & !is.na(total_cost)) %>%
#     group_by(trader_type) %>%
#     summarise(
#       mean_total_cost = mean(total_cost, na.rm = TRUE),
#       median_total_cost = percentile_approx(total_cost, 0.5)
#     ) %>%
#     collect()
#
#   print(summary_data)
#
#   ggplot(summary_data, aes(x = trader_type, y = mean_total_cost, fill = trader_type)) +
#     geom_bar(stat = "identity", show.legend = FALSE) +
#     theme_minimal() +
#     labs(
#       title = "Average Total Cost by Trader Type",
#       x = "Trader Type",
#       y = "Mean Total Cost"
#     ) +
#     theme(axis.text.x = element_text(angle = 45, hjust = 1))
# }
#
# analyze_trader_lead_days(orders_cleaned)
# analyze_status_total_cost(orders_cleaned)
# analyze_trader_status_distribution(orders_cleaned)
# analyze_num_products_status(orders_cleaned)
# analyze_trader_total_cost(orders_cleaned)

# ===========================================================================
# CLASSIFICATION
# ===========================================================================
#
# orders_cleaned has no trader_id (only trader_type) - a specific trader is
# only assigned at receipt time - so "per-trader" running stats can only be
# computed per trader_type here. Renamed to traderType_* below so the name
# doesn't imply per-individual-trader granularity it doesn't have.
#
# lead_days / expected_fulfillment_date are intentionally EXCLUDED from the
# feature set. In generate_data.mjs, missingFulfillment is decided AFTER
# status is chosen and specifically only for CANCELLED/PENDING orders - so
# "is lead_days missing" is partly a disguised copy of the label. Even after
# imputing lead_days (done in clean_data above so the column is still usable
# for descriptive analysis/EDA), using it as a training feature would let
# the model exploit that hidden leakage rather than learn genuine patterns.
# If you fix the generator to decide fulfillment timing independently of the
# status outcome, lead_days can safely be added back as a feature.

# user_window <- orders_cleaned %>%
#   sdf_repartition(partitions = 32) %>%
#   arrange(user_id, created_date) %>%
#   group_by(user_id) %>%
#   mutate(
#     user_order_count = row_number() - 1,
#     user_avg_cost = (cumsum(total_cost) - total_cost) / pmax(row_number() - 1, 1),
#     user_cancelled_count = cumsum(ifelse(status == "CANCELLED", 1, 0)) -
#       ifelse(status == "CANCELLED", 1, 0)
#   ) %>%
#   ungroup() %>%
#   sdf_persist(storage.level = "MEMORY_AND_DISK")
#
# traderType_window <- user_window %>%
#   sdf_repartition(partitions = 32) %>%
#   arrange(trader_type, created_date) %>%
#   group_by(trader_type) %>%
#   mutate(
#     traderType_order_count = row_number() - 1,
#     traderType_avg_cost = (cumsum(total_cost) - total_cost) / pmax(row_number() - 1, 1)
#   ) %>%
#   ungroup() %>%
#   sdf_persist(storage.level = "MEMORY_AND_DISK")
#
# orders_features <- traderType_window %>%
#   mutate(
#     user_order_count = ifelse(is.na(user_order_count), 0, user_order_count),
#     user_avg_cost = ifelse(is.na(user_avg_cost), 0, user_avg_cost),
#     user_cancelled_count = ifelse(is.na(user_cancelled_count), 0, user_cancelled_count),
#     traderType_order_count = ifelse(is.na(traderType_order_count), 0, traderType_order_count),
#     traderType_avg_cost = ifelse(is.na(traderType_avg_cost), 0, traderType_avg_cost)
#   ) %>%
#   sdf_persist(storage.level = "MEMORY_AND_DISK")
#
# class_balance <- orders_features %>% count(status) %>% collect()
# print(class_balance)
#
# statuses <- orders_features %>%
#   distinct(status) %>%
#   collect() %>%
#   pull(status)
#
# set.seed(42)
# train_list <- list()
# test_list <- list()
#
# for (s in statuses) {
#   subset <- orders_features %>% filter(status == s)
#   sp <- sdf_random_split(subset, train = 0.8, test = 0.2, seed = 42)
#   train_list[[s]] <- sp$train
#   test_list[[s]] <- sp$test
# }
#
# train <- sdf_bind_rows(train_list) %>%
#   sdf_repartition(partitions = 32) %>%
#   sdf_persist(storage.level = "MEMORY_AND_DISK")
#
# test <- sdf_bind_rows(test_list) %>%
#   sdf_repartition(partitions = 32) %>%
#   sdf_persist(storage.level = "MEMORY_AND_DISK")
#
# train <- sdf_repartition(train, partitions = 1)
# test <- sdf_repartition(test, partitions = 1)
#
# numeric_cols <- c("total_cost", "num_products",
#                   "user_order_count", "user_avg_cost", "user_cancelled_count",
#                   "traderType_order_count", "traderType_avg_cost")
#
# metrics <- c("f1", "accuracy", "weightedPrecision", "weightedRecall")
# evaluator <- ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = "f1")

# # logistic_regression
# lr_pipeline <- ml_pipeline(sc) %>%
#   ft_string_indexer(input_col = "trader_type", output_col = "trader_type_idx") %>%
#   ft_one_hot_encoder(input_col = "trader_type_idx", output_col = "trader_type_oh") %>%
#   ft_string_indexer(input_col = "day_of_week", output_col = "day_of_week_idx") %>%
#   ft_one_hot_encoder(input_col = "day_of_week_idx", output_col = "day_of_week_oh") %>%
#   ft_string_indexer(input_col = "status", output_col = "label") %>%
#   ft_vector_assembler(input_cols = numeric_cols, output_col = "numeric_features") %>%
#   ft_standard_scaler(input_col = "numeric_features", output_col = "numeric_features_scaled") %>%
#   ft_vector_assembler(input_cols = c("trader_type_oh", "day_of_week_oh", "numeric_features_scaled"),
#                        output_col = "features") %>%
#   ml_logistic_regression(features_col = "features", label_col = "label")
#
# lr_grid <- list(
#   logistic_regression = list(
#     reg_param = c(0.01, 0.1, 0.5),
#     elastic_net_param = c(0.0, 0.5, 1.0)
#   )
# )
#
# lr_cv <- ml_cross_validator(
#   sc,
#   estimator = lr_pipeline,
#   estimator_param_maps = lr_grid,
#   evaluator = evaluator,
#   num_folds = 3
# )
#
# lr_cv_model <- ml_fit(lr_cv, train)
#
# lr_results <- ml_validation_metrics(lr_cv_model)
# print("LR Performances per scenario:")
# print(lr_results)
#
# test_pred_lr <- ml_transform(lr_cv_model$best_model, test)
#
# test_metrics_lr <- lapply(metrics, function(m) {
#   ev <- ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = m)
#   ml_evaluate(ev, test_pred_lr)
# })
# names(test_metrics_lr) <- metrics
#
# print("LR Test metrics:")
# print(test_metrics_lr)
#
# # random forest
# rf_pipeline <- ml_pipeline(sc) %>%
#   ft_string_indexer(input_col = "trader_type", output_col = "trader_type_idx") %>%
#   ft_one_hot_encoder(input_col = "trader_type_idx", output_col = "trader_type_oh") %>%
#   ft_string_indexer(input_col = "day_of_week", output_col = "day_of_week_idx") %>%
#   ft_one_hot_encoder(input_col = "day_of_week_idx", output_col = "day_of_week_oh") %>%
#   ft_string_indexer(input_col = "status", output_col = "label") %>%
#   ft_vector_assembler(input_cols = numeric_cols, output_col = "numeric_features") %>%
#   ft_standard_scaler(input_col = "numeric_features", output_col = "numeric_features_scaled") %>%
#   ft_vector_assembler(input_cols = c("trader_type_oh", "day_of_week_oh", "numeric_features_scaled"),
#                        output_col = "features") %>%
#   ml_random_forest_classifier(
#     features_col = "features",
#     label_col = "label",
#     num_trees = 20,
#     max_depth = 5,
#     seed = 123
#   )
#
# rf_grid <- list(
#   random_forest_classifier = list(
#     num_trees = c(10L, 20L),
#     max_depth = c(3L, 5L)
#   )
# )
#
# rf_cv <- ml_cross_validator(
#   sc,
#   estimator = rf_pipeline,
#   estimator_param_maps = rf_grid,
#   evaluator = evaluator,
#   num_folds = 3
# )
#
# rf_cv_model <- ml_fit(rf_cv, train)
#
# rf_results <- tryCatch({
#   ml_validation_metrics(rf_cv_model)
# }, error = function(e) {
#   rf_cv_model$avg_metrics_df
# })
# print("RF Performances per scenario:")
# print(rf_results)
#
# test_pred_rf <- ml_transform(rf_cv_model$best_model, test)
#
# test_metrics_rf <- lapply(metrics, function(m) {
#   ev <- ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = m)
#   ml_evaluate(ev, test_pred_rf)
# })
# names(test_metrics_rf) <- metrics
#
# print("RF Test metrics:")
# print(test_metrics_rf)

# ---------------------------------------------------------------------------
# mlp_classifier
#
# CHANGE (the main bug): trader_type_idx / day_of_week_idx are STRING-INDEXER
# CODES (0,1,2,3...), not one-hot vectors. Feeding those raw integer codes
# straight into the numeric feature vector tells the network e.g. that
# CARDEALER (idx 3) is "3x more" than SUPERMARKET (idx 0) - a false ordinal
# relationship for a categorical variable. The fix adds explicit
# ft_one_hot_encoder steps and assembles the ONE-HOT columns into the final
# feature vector instead of the raw indices.
# ---------------------------------------------------------------------------
# si_trader  <- ft_string_indexer(sc, input_col = "trader_type", output_col = "trader_type_idx")
# ohe_trader <- ft_one_hot_encoder(sc, input_col = "trader_type_idx", output_col = "trader_type_oh")
# si_dow     <- ft_string_indexer(sc, input_col = "day_of_week", output_col = "day_of_week_idx")
# ohe_dow    <- ft_one_hot_encoder(sc, input_col = "day_of_week_idx", output_col = "day_of_week_oh")
# si_label   <- ft_string_indexer(sc, input_col = "status", output_col = "label")
#
# va_numeric <- ft_vector_assembler(sc, input_cols = numeric_cols, output_col = "numeric_features")
# scaler <- ft_standard_scaler(sc, input_col = "numeric_features", output_col = "numeric_features_scaled")
#
# mlp_feature_cols <- c("trader_type_oh", "day_of_week_oh", "numeric_features_scaled")
# va_final <- ft_vector_assembler(sc, input_cols = mlp_feature_cols, output_col = "features")
#
# # n_features must match the length of the ASSEMBLED vector, not the raw
# # column count. Spark's OneHotEncoder drops the last category by default
# # (dropLast = TRUE), so each one-hot column contributes (n_categories - 1)
# # dimensions, not n_categories.
# n_trader_types <- orders_features %>% distinct(trader_type) %>% count() %>% pull(n)
# n_days <- orders_features %>% distinct(day_of_week) %>% count() %>% pull(n)
# n_features <- (n_trader_types - 1) + (n_days - 1) + length(numeric_cols)
#
# num_classes <- train %>%
#   distinct(status) %>%
#   count() %>%
#   pull(n)
#
# mlp <- ml_multilayer_perceptron_classifier(sc,
#                                            features_col = "features",
#                                            label_col = "label",
#                                            layers = c(n_features, 64, 32, num_classes),
#                                            max_iter = 100,
#                                            seed = 123
# )
#
# pipeline_mlp <- ml_pipeline(si_trader, ohe_trader, si_dow, ohe_dow, si_label,
#                              va_numeric, scaler, va_final, mlp)
# model_mlp <- ml_fit(pipeline_mlp, train)
# preds_mlp <- ml_transform(model_mlp, test)
#
# test_metrics_mlp <- lapply(metrics, function(m) {
#   ev <- ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = m)
#   ml_evaluate(ev, preds_mlp)
# })
# names(test_metrics_mlp) <- metrics
#
# print("MLP Test metrics:")
# print(test_metrics_mlp)
#
# # Per-class breakdown - the overall (weighted) F1/accuracy above can look
# # fine while a minority class like CANCELLED is barely being predicted at
# # all, because it contributes little to a weighted average. A confusion
# # matrix makes that visible.
# confusion_matrix <- preds_mlp %>%
#   count(label, prediction) %>%
#   collect() %>%
#   arrange(label, prediction)
#
# print("--- MLP Confusion Matrix (label x prediction) ---")
# print(confusion_matrix)


# ===========================================================================
# CLUSTERING (K-Means only)
# ===========================================================================
#
# Two problems were fixed here:
#
# 1. The clustering features (total_cost, user_order_count,
#    user_cancelled_count) were never scaled before being assembled. Since
#    total_cost is on a scale of hundreds/thousands while the order/cancel
#    counts are small integers, Euclidean-distance-based K-Means was
#    effectively clustering on total_cost alone - this was the main reason
#    clustering "didn't work" (meaningless silhouette scores, no real
#    separation on the other variables).
#
# 2. The old cluster_data had one row PER ORDER (with a running cumulative
#    total for that user), so the same user showed up many times with
#    different values. That's not customer segmentation - it's clustering
#    order-events, and heavy users get disproportionate weight simply by
#    having more rows. Rebuilt below as one row PER USER with lifetime
#    aggregates, which is what "cluster users by behavior" actually needs.
#
# DBSCAN removed: it isn't distributed in Spark, so it required collecting a
# 5% sample to the driver, which defeats the point of doing this at scale;
# K-Means runs natively and distributedly on the full dataset and is kept as
# the single clustering method per request.

user_features <- orders_cleaned %>%
  group_by(user_id) %>%
  summarise(
    total_orders      = n(),
    total_spend       = sum(total_cost, na.rm = TRUE),
    avg_order_value   = mean(total_cost, na.rm = TRUE),
    cancelled_orders  = sum(as.integer(status == "CANCELLED")),
    avg_num_products  = mean(num_products, na.rm = TRUE)
  ) %>%
  mutate(cancellation_rate = cancelled_orders / total_orders) %>%
  ungroup() %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

cluster_input_cols <- c("total_spend", "avg_order_value", "total_orders",
                         "cancellation_rate", "avg_num_products")

cluster_data <- user_features %>%
  ft_vector_assembler(input_cols = cluster_input_cols, output_col = "raw_features") %>%
  ft_standard_scaler(input_col = "raw_features", output_col = "cluster_features") %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

print("=== K-MEANS CLUSTERING ===")

cluster_evaluator <- ml_clustering_evaluator(sc, features_col = "cluster_features",
                                              metric_name = "silhouette")

k_values <- 2:8
silhouette_scores <- sapply(k_values, function(k) {
  m <- ml_kmeans(cluster_data, features_col = "cluster_features", k = k, seed = 42)
  preds <- ml_predict(m, cluster_data)
  ml_evaluate(cluster_evaluator, preds)
})

k_selection <- data.frame(k = k_values, silhouette = silhouette_scores)
print("--- Silhouette by k ---")
print(k_selection)

p_k <- ggplot(k_selection, aes(x = k, y = silhouette)) +
  geom_line(color = "steelblue") +
  geom_point(color = "steelblue", size = 2) +
  labs(title = "K-Means: Silhouette Score by k",
       x = "Number of clusters (k)", y = "Silhouette score") +
  theme_minimal()
print(p_k)

best_k <- k_selection$k[which.max(k_selection$silhouette)]
cat("Best k by silhouette:", best_k, "\n")

kmeans_final <- ml_kmeans(cluster_data, features_col = "cluster_features", k = best_k, seed = 42)
predictions_kmeans <- ml_predict(kmeans_final, cluster_data)
silhouette_final <- ml_evaluate(cluster_evaluator, predictions_kmeans)

print(paste("K-Means Silhouette (k =", best_k, "):", round(silhouette_final, 4)))

print("--- Cluster Centers (scaled feature space) ---")
print(kmeans_final$centers)

print("--- Cluster Sizes ---")
print(kmeans_final$summary$cluster_sizes())

# Profile clusters using RAW (unscaled) values - much easier to interpret
# than the standardized cluster centers above.
cluster_structure <- predictions_kmeans %>%
  group_by(prediction) %>%
  summarise(
    mean_total_spend       = mean(total_spend, na.rm = TRUE),
    mean_avg_order_value   = mean(avg_order_value, na.rm = TRUE),
    mean_total_orders      = mean(total_orders, na.rm = TRUE),
    mean_cancellation_rate = mean(cancellation_rate, na.rm = TRUE),
    mean_num_products      = mean(avg_num_products, na.rm = TRUE),
    record_count           = n()
  ) %>%
  arrange(prediction) %>%
  collect()

print("--- Cluster Structure (raw feature means) ---")
print(cluster_structure)

local_kmeans <- predictions_kmeans %>%
  sdf_sample(fraction = 0.05, replacement = FALSE, seed = 42) %>%
  collect()
local_kmeans$prediction <- as.factor(local_kmeans$prediction)

p1 <- ggplot(local_kmeans, aes(x = total_spend, y = total_orders, color = prediction)) +
  geom_point(alpha = 0.5, size = 1) +
  labs(
    title = paste0("K-Means (k=", best_k, "): Total Spend vs Total Orders"),
    x = "Total Spend",
    y = "Total Orders",
    color = "Cluster"
  ) +
  theme_minimal()
print(p1)

p2 <- ggplot(local_kmeans, aes(x = total_spend, y = cancellation_rate, color = prediction)) +
  geom_point(alpha = 0.5, size = 1) +
  labs(
    title = paste0("K-Means (k=", best_k, "): Total Spend vs Cancellation Rate"),
    x = "Total Spend",
    y = "Cancellation Rate",
    color = "Cluster"
  ) +
  theme_minimal()
print(p2)

# spark_disconnect(sc)