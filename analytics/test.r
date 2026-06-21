# install.packages("sparklyr")
# install.packages("DBI")
# install.packages("dplyr")
# install.packages("ggplot2")
# install.packages("dbplot")

path <- "file:///C:/Users/MiliBovan/Desktop/master/hyperledger-commerce-chain/analytics/data-generator"

library(sparklyr)
library(DBI)
library(dplyr)
library(ggplot2)
# library(dbplot)

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
  p <- ggplot(top_n_df, aes(x = reorder(Value, Frequency), y = Pct_Of_Total)) +
    geom_col(fill = "steelblue") +
    geom_text(aes(label = paste0(Pct_Of_Total, "%")), hjust = -0.1) +
    coord_flip() +
    labs(title = paste("Top", top_n, "-", col_name),
         x = col_name, y = "Procenat (%)") +
    theme_minimal()

  print(p)

  invisible(list(cardinality = cardinality, top_n = top_n_df))
}

cols <- sdf_schema(users_cleaned)
for (col in cols) {
  cat("Name: ", col[[1]], "\t", "Type: ", col[[2]], "\n")
  if (col[[2]] == "BooleanType") {
    plot_df <- analyze_boolean(users_cleaned, col[[1]])

    p <- ggplot(plot_df, aes(x = factor(Value), y = Pct, fill = factor(Value))) +
      geom_col() +
      geom_text(aes(label = paste0(Pct, "%")), vjust = -0.3) +
      labs(title = paste("users_cleaned -", col[[1]]),
           x = col[[1]], y = "Procenat (%)") +
      theme_minimal() +
      theme(legend.position = "none")

    print(p)
  } else if (col[[2]] == "StringType") {
    is_id <- grepl("id", col[[1]], ignore.case = TRUE)
    analyze_string(users_cleaned, col[[1]], top_n = 5, is_id_like = is_id)
  }
}

# spark_disconnect(sc)