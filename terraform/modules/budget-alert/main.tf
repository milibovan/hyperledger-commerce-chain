resource "azurerm_consumption_budget_subscription" "monthly" {
  name            = "monthly-subscription-budget"
  subscription_id = var.subscription_id

  amount     = var.amount
  time_grain = "Monthly"

  time_period {
    start_date = "2026-06-01T00:00:00Z"
    end_date   = "2027-06-01T00:00:00Z"
  }

  notification {
    enabled   = true
    threshold = 50.0
    operator  = "GreaterThan"

    contact_emails = [
      var.email,
    ]
  }

  notification {
    enabled   = true
    threshold = 80.0
    operator  = "GreaterThan"

    contact_emails = [
      var.email,
    ]
  }

  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = [
      var.email,
    ]
  }

  notification {
    enabled        = true
    threshold      = 110.0
    operator       = "GreaterThan"
    threshold_type = "Forecasted"

    contact_emails = [
      var.email
    ]
  }
}
