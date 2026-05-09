resource "azurerm_resource_group" "rg" {
  name     = "rg-eus-snd-orderprocessing"
  location = "eastus"
  tags = {
    Environment = "Sandbox"
  }
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-eus-snd-orderprocessing"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "orderprocessing-aks"

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_D2_v2"

    upgrade_settings {
      drain_timeout_in_minutes      = 0
      max_surge                     = "10%"
      node_soak_duration_in_minutes = 0
    }
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Sandbox"
  }
}
