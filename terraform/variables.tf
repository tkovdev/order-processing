## AZURE ##
variable "azure_client_id" {
  type      = string
}

variable "azure_client_secret" {
  type      = string
  sensitive = true
}

variable "azure_subscription_id" {
  type      = string
}

variable "azure_tenant_id" {
  type      = string
}

## MONGO ##
variable "atlas_public_key" {
  type      = string
  sensitive = true
}

variable "atlas_private_key" {
  type      = string
  sensitive = true
}

variable "atlas_org_id" {
  type = string
}

variable "atlas_project_name" {
  type    = string
  default = "order-processing"
}

variable "atlas_cluster_name" {
  type    = string
  default = "order-processing-cluster"
}

variable "atlas_region" {
  type    = string
  default = "US_EAST_2"
}

variable "app_db_name" {
  type    = string
  default = "order-processing"
}

variable "app_db_user" {
  type    = string
  default = "orderprocessing_app"
}

variable "app_access_cidr" {
  type    = string
  default = "0.0.0.0/0"
}