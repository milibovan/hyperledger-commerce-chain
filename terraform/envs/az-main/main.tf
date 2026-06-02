data "azurerm_subscription" "current" {}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.project_name}-${local.name_suffix}"
  location = var.location

  tags = merge({
    Name = "rg-${local.project_name}-${local.name_suffix}"
  }, local.tags)
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet${local.name_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = var.vnet_address_space

  tags = merge({
    Name = "vnet-${local.project_name}-${local.name_suffix}"
  }, local.tags)
}

resource "azurerm_subnet" "compute" {
  name                 = "compute-subnet${local.name_suffix}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.compute_subnet_address_prefix

  delegation {
    name = "aca-delegation"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_network_security_group" "app" {
  name                = "app-nsg${local.name_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "allow-http"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-https"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = merge({
    Name = "app-nsg-${local.project_name}-${local.name_suffix}"
  }, local.tags)
}

resource "azurerm_subnet_network_security_group_association" "compute" {
  subnet_id                 = azurerm_subnet_compute.id
  network_security_group_id = azurerm_network_security_group.app.id
}