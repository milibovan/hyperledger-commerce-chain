# install.packages("sparklyr")
# install.packages("DBI")
# install.packages("dplyr")
# install.packages("ggplot2")
# install.packages("dbplot")
# install.packages("scales")
# install.packages("sparkxgb")
# install.packages("xgboost")
# install.packages("rmarkdown")
# install.packages("dbscan")

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

# Cleaning data
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

  cols_to_drop <- na_summary %>%
    filter(Pct_Missing > 0 & Pct_Missing < 15) %>%
    pull(Column)
  cols_to_fill <- na_summary %>%
    filter(Pct_Missing >= 15) %>%
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
      if (col %in% c("cancelled_date", "cancelled_by")) {
        cleaned_df <- cleaned_df %>%
          mutate(!!sym(col) := ifelse(is.na(!!sym(col)), "Not Cancelled", as.character(!!sym(col))))
      } else if (col == "expiry_date") {
        cleaned_df <- cleaned_df %>%
          mutate(!!sym(col) := ifelse(is.na(!!sym(col)), "No Expiry Date", as.character(!!sym(col))))
      } else if (col_type %in% c("DoubleType", "IntegerType", "LongType", "FloatType")) {
        med_val <- cleaned_df %>%
          summarise(m = percentile_approx(!!sym(col), 0.5, na.rm = TRUE)) %>%
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
#   minimum <- spark_df %>%
#     summarise(min_value = min(!!sym(col_name), na.rm = TRUE)) %>%
#     collect()
#
#   maximum <- spark_df %>%
#     summarise(max_value = max(!!sym(col_name), na.rm = TRUE)) %>%
#     collect()
#
#   median <- spark_df %>%
#     summarise(mean_value = mean(!!sym(col_name), na.rm = TRUE)) %>%
#     collect()
#
#   average <- spark_df %>%
#     summarise(avg_value = average(!!sym(col_name), na.rm = TRUE)) %>%
#     collect()
#
#   quantile <- spark_df %>%
#     summarise(qua_value = quantile(!!sym(col_name), na.rm = TRUE)) %>%
#     collect()
#
#   print(minimum, maximum, median, average, quantile)
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

# Classification
user_window <- orders_cleaned %>%
  sdf_repartition(partitions = 32) %>%
  arrange(user_id, created_date) %>%
  group_by(user_id) %>%
  mutate(
    user_order_count = row_number() - 1,
    user_avg_cost = (cumsum(total_cost) - total_cost) / pmax(row_number() - 1, 1),
    user_cancelled_count = cumsum(ifelse(status == "CANCELLED", 1, 0)) -
      ifelse(status == "CANCELLED", 1, 0)
  ) %>%
  ungroup() %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

trader_window <- user_window %>%
  sdf_repartition(partitions = 32) %>%
  arrange(trader_type, created_date) %>%
  group_by(trader_type) %>%
  mutate(
    trader_order_count = row_number() - 1,
    trader_avg_cost = (cumsum(total_cost) - total_cost) / pmax(row_number() - 1, 1)
  ) %>%
  ungroup() %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

# receipts_by_order <- receipts_cleaned %>%
#   group_by(order_id) %>%
#   summarise(
#     receipt_count = n(),
#     receipt_total_cost = sum(total_cost, na.rm = TRUE),
#     receipt_avg_cost = mean(total_cost, na.rm = TRUE),
#     receipt_cancelled_count = sum(ifelse(status == "CANCELLED", 1, 0)),
#     receipt_completed_count = sum(ifelse(status == "COMPLETED", 1, 0)),
#     has_receipt = 1L
#   ) %>%
#   ungroup()

orders_features <- trader_window %>%
  mutate(
    user_order_count = ifelse(is.na(user_order_count), 0, user_order_count),
    user_avg_cost = ifelse(is.na(user_avg_cost), 0, user_avg_cost),
    user_cancelled_count = ifelse(is.na(user_cancelled_count), 0, user_cancelled_count),
    trader_order_count = ifelse(is.na(trader_order_count), 0, trader_order_count),
    trader_avg_cost = ifelse(is.na(trader_avg_cost), 0, trader_avg_cost)
  )

model_data <- orders_features %>%
  ft_string_indexer(input_col = "trader_type", output_col = "trader_type_idx") %>%
  ft_one_hot_encoder(input_col = "trader_type_idx", output_col = "trader_type_oh") %>%
  ft_string_indexer(input_col = "day_of_week", output_col = "day_of_week_idx") %>%
  ft_one_hot_encoder(input_col = "day_of_week_idx", output_col = "day_of_week_oh") %>%
  ft_string_indexer(input_col = "status", output_col = "label")

model_data <- model_data %>%
  ft_vector_assembler(
    input_cols = c("total_cost", "num_products", "lead_days",
                   "user_order_count", "user_avg_cost", "user_cancelled_count",
                   "trader_order_count", "trader_avg_cost"),
    output_col = "numeric_features"
  ) %>%
  ft_standard_scaler(
    input_col = "numeric_features",
    output_col = "numeric_features_scaled"
  )

feature_cols <- c(
  "trader_type_oh", "day_of_week_oh",
  "numeric_features_scaled"
)

model_data <- model_data %>%
  ft_vector_assembler(input_cols = feature_cols, output_col = "features")

model_data <- model_data %>% sdf_persist(storage.level = "MEMORY_AND_DISK")

class_balance <- model_data %>% count(status) %>% collect()
print(class_balance)

set.seed(42)
train_list <- list()
test_list <- list()

class_balance <- orders_features %>% count(status) %>% collect()
print(class_balance)

statuses <- orders_features %>%
  distinct(status) %>%
  collect() %>%
  pull(status)

train_list <- list()
test_list <- list()

for (s in statuses) {
  subset <- orders_features %>% filter(status == s)
  sp <- sdf_random_split(subset, train = 0.8, test = 0.2, seed = 42)
  train_list[[s]] <- sp$train
  test_list[[s]] <- sp$test
}

train <- sdf_bind_rows(train_list) %>%
  sdf_repartition(partitions = 32) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

test <- sdf_bind_rows(test_list) %>%
  sdf_repartition(partitions = 32) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

train <- sdf_repartition(train, partitions = 1)
test <- sdf_repartition(test, partitions = 1)

feature_cols <- c(
  "trader_type_oh", "day_of_week_oh",
  "numeric_features_scaled"
)

numeric_cols <- c("total_cost", "num_products", "lead_days",
                  "user_order_count", "user_avg_cost", "user_cancelled_count",
                  "trader_order_count", "trader_avg_cost")

metrics <- c("f1", "accuracy", "weightedPrecision", "weightedRecall")
evaluator <- ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = "f1")

# # logistic_regression
# lr_pipeline <- ml_pipeline(sc) %>%
#   ft_string_indexer(input_col = "trader_type", output_col = "trader_type_idx") %>%
#   ft_one_hot_encoder(input_col = "trader_type_idx", output_col = "trader_type_oh") %>%
#   ft_string_indexer(input_col = "day_of_week", output_col = "day_of_week_idx") %>%
#   ft_one_hot_encoder(input_col = "day_of_week_idx", output_col = "day_of_week_oh") %>%
#   ft_string_indexer(input_col = "status", output_col = "label") %>%
#   ft_vector_assembler(input_cols = numeric_cols, output_col = "numeric_features") %>%
#   ft_standard_scaler(input_col = "numeric_features", output_col = "numeric_features_scaled") %>%
#   ft_vector_assembler(input_cols = feature_cols, output_col = "features") %>%
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
#   ft_vector_assembler(input_cols = feature_cols, output_col = "features") %>%
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

# mlp_classifier
si_trader <- ft_string_indexer(sc, input_col = "trader_type", output_col = "trader_type_idx")
si_dow <- ft_string_indexer(sc, input_col = "day_of_week", output_col = "day_of_week_idx")
si_label <- ft_string_indexer(sc, input_col = "status", output_col = "label")

va_numeric <- ft_vector_assembler(sc, input_cols = numeric_cols, output_col = "numeric_features")
scaler <- ft_standard_scaler(sc, input_col = "numeric_features", output_col = "numeric_features_scaled")

xgb_feature_cols <- c("trader_type_idx", "day_of_week_idx", "numeric_features_scaled")

va_final <- ft_vector_assembler(sc, input_cols = xgb_feature_cols, output_col = "features")

n_features <- length(c("trader_type_idx", "day_of_week_idx", numeric_cols))
num_classes <- train %>%
  distinct(status) %>%
  count() %>%
  pull(n)

mlp <- ml_multilayer_perceptron_classifier(sc,
                                           features_col = "features",
                                           label_col = "label",
                                           layers = c(n_features, 64, 32, num_classes),
                                           max_iter = 100,
                                           seed = 123
)

pipeline_mlp <- ml_pipeline(si_trader, si_dow, si_label, va_numeric, scaler, va_final, mlp)
model_mlp <- ml_fit(pipeline_mlp, train)
preds_mlp <- ml_transform(model_mlp, test)

accuracy_mlp <- ml_evaluate(
  ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = "accuracy"),
  preds_mlp
)
print(paste("MLP Test Accuracy:", round(accuracy_mlp, 4)))

# clusterization
cluster_data <- model_data %>%
  ft_vector_assembler(
    input_cols = c("total_cost", "user_order_count", "user_cancelled_count"),
    output_col = "cluster_features"
  ) %>%
  sdf_persist(storage.level = "MEMORY_AND_DISK")

cluster_evaluator <- ml_clustering_evaluator(sc, metric_name = "silhouette")

print("=== K-MEANS CLUSTERING ===")

kmeans_s1 <- ml_kmeans(cluster_data, features_col = "cluster_features", k = 3, seed = 42)
predictions_kmeans_s1 <- ml_predict(kmeans_s1, cluster_data)
silhouette_kmeans_s1 <- ml_evaluate(kmeans_s1, cluster_data)$silhouette()

kmeans_s2 <- ml_kmeans(cluster_data, features_col = "cluster_features", k = 5, seed = 42)
predictions_kmeans_s2 <- ml_predict(kmeans_s2, cluster_data)
silhouette_kmeans_s2 <- ml_evaluate(kmeans_s2, cluster_data)$silhouette()

print(paste("K-Means Silhouette - Scenario 1 (k=3):", round(silhouette_kmeans_s1, 4)))
print(paste("K-Means Silhouette - Scenario 2 (k=5):", round(silhouette_kmeans_s2, 4)))

print("--- Cluster Centers - Scenario 1 (k=3) ---")
print(kmeans_s1$centers)

print("--- Cluster Centers - Scenario 2 (k=5) ---")
print(kmeans_s2$centers)

print("--- Cluster Sizes - Scenario 1 (k=3) ---")
print(kmeans_s1$summary$cluster_sizes())

print("--- Cluster Sizes - Scenario 2 (k=5) ---")
print(kmeans_s2$summary$cluster_sizes())

cluster_structure_s1 <- predictions_kmeans_s1 %>%
  group_by(prediction) %>%
  summarise(
    mean_total_cost = mean(total_cost, na.rm = TRUE),
    mean_order_count = mean(user_order_count, na.rm = TRUE),
    mean_cancelled_count = mean(user_cancelled_count, na.rm = TRUE),
    mean_avg_cost = mean(user_avg_cost, na.rm = TRUE),
    record_count = n()
  ) %>%
  arrange(prediction) %>%
  collect()

print("--- Cluster Structure - Scenario 1 (k=3) ---")
print(cluster_structure_s1)

cluster_structure_s2 <- predictions_kmeans_s2 %>%
  group_by(prediction) %>%
  summarise(
    mean_total_cost = mean(total_cost, na.rm = TRUE),
    mean_order_count = mean(user_order_count, na.rm = TRUE),
    mean_cancelled_count = mean(user_cancelled_count, na.rm = TRUE),
    mean_avg_cost = mean(user_avg_cost, na.rm = TRUE),
    record_count = n()
  ) %>%
  arrange(prediction) %>%
  collect()

print("--- Cluster Structure - Scenario 2 (k=5) ---")
print(cluster_structure_s2)

print("=== DBSCAN CLUSTERING ===")
local_data_dbscan <- cluster_data %>%
  select(total_cost, user_order_count, user_cancelled_count, user_avg_cost, trader_type) %>%
  sdf_sample(fraction = 0.05, replacement = FALSE, seed = 42) %>%
  collect()

library(dbscan)

scaled_data <- scale(local_data_dbscan[, c("total_cost", "user_order_count",
                                           "user_cancelled_count", "user_avg_cost")])

dbscan_s1 <- dbscan(scaled_data, eps = 0.5, minPts = 5)
local_data_dbscan$cluster_s1 <- as.factor(dbscan_s1$cluster)

print("--- DBSCAN Scenario 1 (eps=0.5, minPts=5) ---")
print(table(dbscan_s1$cluster))
print(paste("Number of clusters (excl. noise):",
            length(unique(dbscan_s1$cluster[dbscan_s1$cluster != 0]))))
print(paste("Noise points (cluster=0):",
            sum(dbscan_s1$cluster == 0)))

dbscan_s2 <- dbscan(scaled_data, eps = 1.0, minPts = 10)
local_data_dbscan$cluster_s2 <- as.factor(dbscan_s2$cluster)

print("--- DBSCAN Scenario 2 (eps=1.0, minPts=10) ---")
print(table(dbscan_s2$cluster))
print(paste("Number of clusters (excl. noise):",
            length(unique(dbscan_s2$cluster[dbscan_s2$cluster != 0]))))
print(paste("Noise points (cluster=0):",
            sum(dbscan_s2$cluster == 0)))

dbscan_structure_s1 <- local_data_dbscan %>%
  group_by(cluster_s1) %>%
  summarise(
    mean_total_cost = mean(total_cost, na.rm = TRUE),
    mean_order_count = mean(user_order_count, na.rm = TRUE),
    mean_cancelled_count = mean(user_cancelled_count, na.rm = TRUE),
    mean_avg_cost = mean(user_avg_cost, na.rm = TRUE),
    record_count = n()
  ) %>%
  arrange(cluster_s1)

print("--- DBSCAN Cluster Structure - Scenario 1 ---")
print(dbscan_structure_s1)

dbscan_structure_s2 <- local_data_dbscan %>%
  group_by(cluster_s2) %>%
  summarise(
    mean_total_cost = mean(total_cost, na.rm = TRUE),
    mean_order_count = mean(user_order_count, na.rm = TRUE),
    mean_cancelled_count = mean(user_cancelled_count, na.rm = TRUE),
    mean_avg_cost = mean(user_avg_cost, na.rm = TRUE),
    record_count = n()
  ) %>%
  arrange(cluster_s2)

print("--- DBSCAN Cluster Structure - Scenario 2 ---")
print(dbscan_structure_s2)

local_kmeans_s1 <- predictions_kmeans_s1 %>%
  sdf_sample(fraction = 0.05, replacement = FALSE, seed = 42) %>%
  collect()
local_kmeans_s1$prediction <- as.factor(local_kmeans_s1$prediction)

local_kmeans_s2 <- predictions_kmeans_s2 %>%
  sdf_sample(fraction = 0.05, replacement = FALSE, seed = 42) %>%
  collect()
local_kmeans_s2$prediction <- as.factor(local_kmeans_s2$prediction)

p1 <- ggplot(local_kmeans_s1, aes(x = total_cost, y = user_order_count, color = prediction)) +
  geom_point(alpha = 0.5, size = 1) +
  labs(
    title = "K-Means (k=3): Total Cost vs Order Count",
    x = "Total Cost",
    y = "User Order Count",
    color = "Cluster"
  ) +
  theme_minimal()
print(p1)

p2 <- ggplot(local_kmeans_s2, aes(x = total_cost, y = user_cancelled_count, color = prediction)) +
  geom_point(alpha = 0.5, size = 1) +
  labs(
    title = "K-Means (k=5): Total Cost vs Cancelled Count",
    x = "Total Cost",
    y = "User Cancelled Count",
    color = "Cluster"
  ) +
  theme_minimal()
print(p2)

p3 <- ggplot(local_data_dbscan, aes(x = total_cost, y = user_order_count, color = cluster_s1)) +
  geom_point(alpha = 0.5, size = 1) +
  labs(
    title = "DBSCAN (eps=0.5, minPts=5): Total Cost vs Order Count",
    x = "Total Cost",
    y = "User Order Count",
    color = "Cluster (0 = noise)"
  ) +
  theme_minimal()
print(p3)

p4 <- ggplot(local_data_dbscan, aes(x = total_cost, y = user_cancelled_count, color = cluster_s2)) +
  geom_point(alpha = 0.5, size = 1) +
  labs(
    title = "DBSCAN (eps=1.0, minPts=10): Total Cost vs Cancelled Count",
    x = "Total Cost",
    y = "User Cancelled Count",
    color = "Cluster (0 = noise)"
  ) +
  theme_minimal()
print(p4)

# spark_disconnect(sc)