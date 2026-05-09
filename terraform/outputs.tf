## AZURE ##
output "client_certificate" {
  value     = azurerm_kubernetes_cluster.aks.kube_config[0].client_certificate
  sensitive = true
}

output "kube_config" {
  value = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}

## MONGO ##
output "mongodb_srv_uri" {
  value     = mongodbatlas_advanced_cluster.cluster.connection_strings.standard_srv
  sensitive = true
}

output "app_db_user" {
  value = mongodbatlas_database_user.app.username
}

output "app_db_password" {
  value     = random_password.db_user_password.result
  sensitive = true
}