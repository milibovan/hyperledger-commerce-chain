# install.packages("sparklyr")
# install.packages("DBI")
# install.packages("dplyr")
# install.packages("ggplot2")
install.packages("dbplot")
install.packages("scales")

path <- "file:///C:/Users/MiliBovan/Desktop/master/hyperledger-commerce-chain/analytics/data-generator"

library(sparklyr)
library(DBI)
library(dplyr)
library(ggplot2)
library(dbplot)
library(scales)

spark_install(version = "3.3")

sc <- spark_connect(master = "local", version = "3.3")

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
# all_entities <- list(
#   users = users, traders = traders, products = products,
#   orders = orders, receipts = receipts,
#   order_products = order_products,
#   receipt_products = receipt_products,
#   trader_products = trader_products
# )
#
# missing_summary <- bind_rows(lapply(names(all_entities), function(nm) {
#   df <- show_missing_values(all_entities[[nm]])
#   df$Entity <- nm
#   df$Pct_Missing <- round(100 * df$No_NA / sdf_nrow(all_entities[[nm]]), 2)
#   df
# }))
#
# missing_summary <- missing_summary %>% filter(No_NA > 0)
#
# ggplot(missing_summary, aes(x = reorder(paste(Entity, Column, sep = "."), Pct_Missing),
#                              y = Pct_Missing, fill = Entity)) +
#   geom_col() +
#   coord_flip() +
#   labs(title = "Percentage of missing columns",
#        x = "Entity.Column", y = "% NA") +
#   theme_minimal()

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

  if (length(cols_to_drop) > 0) {
    for (col in cols_to_drop) {
      cleaned_df <- cleaned_df %>% filter(!is.na(!!sym(col)))
    }
  }

  col_types <- sdf_schema(cleaned_df)

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

  return(cleaned_df)
}

users_cleaned <- clean_data(users, "users")
traders_cleaned <- clean_data(traders, "traders")
products_cleaned <- clean_data(products, "products")

orders_cleaned <- clean_data(orders, "orders") %>%
  inner_join(users_cleaned %>% select(id), by = c("user_id" = "id"))

receipts_cleaned <- clean_data(receipts, "receipts") %>%
  inner_join(orders_cleaned %>% select(id), by = c("order_id" = "id")) %>%
  inner_join(traders_cleaned %>% select(id), by = c("trader_id" = "id")) %>%
  inner_join(users_cleaned %>% select(id), by = c("user_id" = "id"))

order_products_cleaned <- clean_data(order_products, "order_products") %>%
  inner_join(orders_cleaned %>% select(id), by = c("order_id" = "id")) %>%
  inner_join(products_cleaned %>% select(id), by = c("product_id" = "id"))

receipt_products_cleaned <- clean_data(receipt_products, "receipt_products") %>%
  inner_join(receipts_cleaned %>% select(id), by = c("receipt_id" = "id")) %>%
  inner_join(products_cleaned %>% select(id), by = c("product_id" = "id"))

trader_products_cleaned <- clean_data(trader_products, "trader_products") %>%
  inner_join(traders_cleaned %>% select(id), by = c("trader_id" = "id")) %>%
  inner_join(products_cleaned %>% select(id), by = c("product_id" = "id"))


# CLEANING SUMMARY
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
analyze_boolean <- function(spark_df, col_name) {
  total_rows <- sdf_nrow(spark_df)

  counts_df <- spark_df %>%
    group_by(!!sym(col_name)) %>%
    summarise(Frequency = n()) %>%
    collect()

  counts_df$Pct <- round(100 * counts_df$Frequency / total_rows, 2)

  colnames(counts_df)[1] <- "Value"

  p <- ggplot(counts_df, aes(x = factor(Value), y = Pct, fill = factor(Value))) +
    geom_col() +
    geom_text(aes(label = paste0(Pct, "%")), vjust = -0.3) +
    labs(title = paste("orders_cleaned -", col[[1]]),
         x = col[[1]], y = "Percentage (%)") +
    theme_minimal() +
    theme(legend.position = "none")

  print(p)

  print(counts_df)

  counts_df
}

analyze_string <- function(spark_df, col_name, top_n = 5, is_id_like = FALSE) {
  total_rows <- sdf_nrow(spark_df)

  cardinality <- spark_df %>%
    summarise(n_distinct = n_distinct(!!sym(col_name))) %>%
    pull(n_distinct)

  top_n_df <- spark_df %>%
    group_by(!!sym(col_name)) %>%
    summarise(Frequency = n()) %>%
    arrange(desc(Frequency)) %>%
    head(top_n) %>%
    collect()

  top_n_df$Pct_Of_Total <- round(100 * top_n_df$Frequency / total_rows, 2)
  colnames(top_n_df)[1] <- "Value"

  print(top_n_df)

  if (is_id_like) {
    duplicates <- total_rows - cardinality

    dup_examples <- spark_df %>%
      group_by(!!sym(col_name)) %>%
      summarise(Count = n()) %>%
      filter(Count > 1) %>%
      arrange(desc(Count)) %>%
      head(5) %>%
      collect()

    print(dup_examples)
  }
  should_plot <- !is_id_like && sum(top_n_df$Pct_Of_Total) >= 1

  if (should_plot) {
    p <- ggplot(top_n_df, aes(x = reorder(Value, Frequency), y = Pct_Of_Total)) +
      geom_col(fill = "steelblue") +
      geom_text(aes(label = paste0(Pct_Of_Total, "%")), hjust = -0.1) +
      coord_flip() +
      labs(title = paste("Top", top_n, "-", col_name),
           x = col_name, y = "Percentage (%)") +
      theme_minimal()

    print(p)
  }

  invisible(list(cardinality = cardinality, top_n = top_n_df))
}

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

analyze_numeric <- function(spark_df, col_name) {
  stats <- spark_df %>%
    summarise(
      Min = min(!!sym(col_name)),
      Max = max(!!sym(col_name)),
      Prosek = mean(!!sym(col_name)),
      Std_Dev = sd(!!sym(col_name)),

      Median = percentile_approx(!!sym(col_name), 0.5),

      Quantile_25 = percentile_approx(!!sym(col_name), 0.25),
      Quantile_75 = percentile_approx(!!sym(col_name), 0.75)
    ) %>%
    collect()

  data <- data.frame(
    Metrika = colnames(stats),
    Vrednost = as.numeric(stats[1,])
  )

  if (is.finite(stats$Min[1]) &&
    is.finite(stats$Max[1]) &&
    stats$Max[1] > stats$Min[1]) {
    n_bins <- 30
    splits <- seq(stats$Min[1], stats$Max[1], length.out = n_bins + 1)
    splits[1] <- -Inf
    splits[length(splits)] <- Inf

    binned <- spark_df %>%
      filter(!is.na(!!sym(col_name))) %>%
      ft_bucketizer(input_col = col_name, output_col = "bucket", splits = splits) %>%
      group_by(bucket) %>%
      summarise(count = n()) %>%
      collect() %>%
      arrange(bucket)

    binned$bin_center <- (splits[binned$bucket + 1] + splits[binned$bucket + 2]) / 2
    binned$bin_center[binned$bucket == 0] <- stats$Min[1]
    binned$bin_center[binned$bucket == n_bins - 1] <- stats$Max[1]

    p_hist <- ggplot(binned, aes(x = bin_center, y = count)) +
      geom_col(fill = "steelblue", width = (stats$Max[1] - stats$Min[1]) / n_bins * 0.9) +
      labs(title = paste("Distribucija -", col_name),
           x = col_name, y = "Broj zapisa") +
      theme_minimal()

    print(p_hist)
  }

  box_df <- data.frame(
    x = col_name,
    ymin = stats$Min[1],
    lower = stats$Quantile_25[1],
    middle = stats$Median[1],
    upper = stats$Quantile_75[1],
    ymax = stats$Max[1]
  )

  p_box <- ggplot(box_df, aes(x = x)) +
    geom_boxplot(aes(ymin = ymin, lower = lower, middle = middle, upper = upper, ymax = ymax),
                 stat = "identity", fill = "lightblue") +
    labs(title = paste("Boxplot -", col_name), x = "", y = col_name) +
    theme_minimal()

  print(p_box)

  print(data)
}

analyze_timestamp <- function(spark_df, col_name) {
  stats <- spark_df %>%
    summarise(
      Min = min(!!sym(col_name), na.rm = TRUE),
      Max = max(!!sym(col_name), na.rm = TRUE)
    ) %>%
    collect()

  min_date <- stats$Min[1]
  max_date <- stats$Max[1]
  day_span <- as.numeric(difftime(max_date, min_date, units = "days"))

  data <- data.frame(
    Metrics = c("Min", "Max", "Span (days)"),
    Value = c(as.character(min_date), as.character(max_date), round(day_span, 1))
  )

  monthly <- spark_df %>%
    filter(!is.na(!!sym(col_name))) %>%
    mutate(year_month = date_format(!!sym(col_name), "yyyy-MM")) %>%
    group_by(year_month) %>%
    summarise(count = n()) %>%
    arrange(year_month) %>%
    collect()

  p <- ggplot(monthly, aes(x = year_month, y = count, group = 1)) +
    geom_line(color = "steelblue") +
    geom_point(color = "steelblue") +
    labs(title = paste("Broj zapisa po mesecu -", col_name),
         x = "Godina-Mesec", y = "Broj zapisa") +
    theme_minimal() +
    theme(axis.text.x = element_text(angle = 90, hjust = 1))

  print(p)

  print(data)

  invisible(list(min = min_date, max = max_date, range_days = day_span))
}

analyze_and_visualize <- function(data) {
  cols <- sdf_schema(data)
  for (col in cols) {
    cat("Name: ", col[[1]], "\t", "Type: ", col[[2]], "\n")
    if (col[[2]] == "BooleanType") {
      plot_df <- analyze_boolean(data, col[[1]])
    } else if (col[[2]] == "StringType") {
      is_id <- grepl("id", col[[1]], ignore.case = TRUE)
      analyze_string(data, col[[1]], top_n = 5, is_id_like = is_id)
    } else if (col[[2]] == "DoubleType" ||
      col[[2]] == "IntegerType" ||
      col[[2]] == "LongType") {
      analyze_numeric(data, col[[1]])
    } else if (col[[2]] == "TimestampType") {
      analyze_timestamp(data, col[[1]])
    }
  }
}

analyze_and_visualize(users_cleaned)
analyze_and_visualize(traders_cleaned)
analyze_and_visualize(products_cleaned)

analyze_and_visualize(orders_cleaned)
analyze_and_visualize(receipts_cleaned)
analyze_and_visualize(order_products_cleaned)
analyze_and_visualize(receipt_products_cleaned)
analyze_and_visualize(trader_products_cleaned)

analyze_trader_lead_days <- function(spark_df) {
  summary_data <- spark_df %>%
    filter(!is.na(trader_type) & !is.na(lead_days)) %>%
    group_by(trader_type) %>%
    summarise(mean_lead_days = mean(lead_days, na.rm = TRUE)) %>%
    collect()

  print(summary_data)

  ggplot(summary_data, aes(x = trader_type, y = mean_lead_days, fill = trader_type)) +
    geom_bar(stat = "identity", show.legend = FALSE) +
    theme_minimal() +
    labs(
      title = "Average Lead Days by Trader Type",
      x = "Trader Type",
      y = "Mean Lead Days"
    ) +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
}

analyze_status_total_cost <- function(spark_df) {
  summary_data <- spark_df %>%
    filter(!is.na(status) & !is.na(total_cost)) %>%
    group_by(status) %>%
    summarise(mean_total_cost = mean(total_cost, na.rm = TRUE)) %>%
    collect()

  print(summary_data)

  ggplot(summary_data, aes(x = status, y = mean_total_cost, fill = status)) +
    geom_bar(stat = "identity", show.legend = FALSE) +
    theme_minimal() +
    labs(
      title = "Average Total Cost by Order Status",
      x = "Order Status",
      y = "Mean Total Cost"
    )
}

analyze_trader_status_distribution <- function(spark_df) {
  summary_data <- spark_df %>%
    filter(!is.na(trader_type) & !is.na(status)) %>%
    group_by(trader_type, status) %>%
    count() %>%
    collect()

  print(summary_data)

  ggplot(summary_data, aes(x = trader_type, y = n, fill = status)) +
    geom_bar(stat = "identity", position = "fill") +
    scale_y_continuous(labels = scales::percent) +
    theme_minimal() +
    labs(
      title = "Order Status Distribution by Trader Type",
      x = "Trader Type",
      y = "Percentage Share",
      fill = "Order Status"
    ) +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
}

analyze_num_products_status <- function(spark_df) {
  summary_data <- spark_df %>%
    filter(!is.na(num_products) & !is.na(status)) %>%
    group_by(num_products, status) %>%
    count() %>%
    collect()

  print(summary_data)

  ggplot(summary_data, aes(x = factor(num_products), y = n, fill = status)) +
    geom_bar(stat = "identity", position = "fill") +
    scale_y_continuous(labels = scales::percent) +
    theme_minimal() +
    labs(
      title = "Order Status Breakdown by Number of Products",
      x = "Number of Products in Order",
      y = "Percentage Share",
      fill = "Order Status"
    )
}

analyze_trader_total_cost <- function(spark_df) {
  summary_data <- spark_df %>%
    filter(!is.na(trader_type) & !is.na(total_cost)) %>%
    group_by(trader_type) %>%
    summarise(
      mean_total_cost = mean(total_cost, na.rm = TRUE),
      median_total_cost = percentile_approx(total_cost, 0.5)
    ) %>%
    collect()

  print(summary_data)

  ggplot(summary_data, aes(x = trader_type, y = mean_total_cost, fill = trader_type)) +
    geom_bar(stat = "identity", show.legend = FALSE) +
    theme_minimal() +
    labs(
      title = "Average Total Cost by Trader Type",
      x = "Trader Type",
      y = "Mean Total Cost"
    ) +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
}

analyze_trader_lead_days(orders_cleaned)
analyze_status_total_cost(orders_cleaned)
analyze_trader_status_distribution(orders_cleaned)
analyze_num_products_status(orders_cleaned)
analyze_trader_total_cost(orders_cleaned)

# Classification
user_window <- orders_cleaned %>%
  arrange(user_id, created_date) %>%
  group_by(user_id) %>%
  mutate(
    user_order_count = row_number() - 1,
    user_avg_cost = (cumsum(total_cost) - total_cost) / pmax(row_number() - 1, 1),
    user_cancelled_count = cumsum(ifelse(status == "CANCELLED", 1, 0)) -
      ifelse(status == "CANCELLED", 1, 0)
  ) %>%
  ungroup()

trader_window <- user_window %>%
  arrange(trader_type, created_date) %>%
  group_by(trader_type) %>%
  mutate(
    trader_order_count = row_number() - 1,
    trader_avg_cost = (cumsum(total_cost) - total_cost) / pmax(row_number() - 1, 1)
  ) %>%
  ungroup()

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

class_balance <- model_data %>% count(status) %>% collect()
print(class_balance)

set.seed(42)
train_list <- list()
test_list <- list()

statuses <- model_data %>% distinct(status) %>% pull(status)

for (s in statuses) {
  subset <- model_data %>% filter(status == s)
  sp <- sdf_random_split(subset, train = 0.8, test = 0.2, seed = 42)
  train_list[[s]] <- sp$train
  test_list[[s]] <- sp$test
}

train <- sdf_bind_rows(train_list)
test <- sdf_bind_rows(test_list)

metrics <- c("f1", "accuracy", "weightedPrecision", "weightedRecall")
evaluator <- ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = "f1")

lr <- ml_logistic_regression(sc, features_col = "features", label_col = "label")

lr_grid <- list(
  logistic_regression = list(
    reg_param = c(0.01, 0.1, 0.5),
    elastic_net_param = c(0.0, 0.5, 1.0)
  )
)

lr_cv <- ml_cross_validator(
  sc,
  estimator = lr,
  estimator_param_maps = lr_grid,
  evaluator = evaluator,
  num_folds = 3
)

lr_cv_model <- ml_fit(lr_cv, train)

lr_results <- ml_validation_metrics(lr_cv_model)
print("LR Performances per scenario:")
print(lr_results)

best_model <- lr_cv_model$best_model

test_pred <- ml_transform(best_model, test)

test_metrics <- lapply(metrics, function(m) {
  ev <- ml_multiclass_classification_evaluator(sc, label_col = "label", metric_name = m)
  ml_evaluate(ev, test_pred)
})
names(test_metrics) <- metrics

print("Test metrics:")
print(test_metrics)

# spark_disconnect(sc)