resource "mongodbatlas_project" "project" {
  name   = var.atlas_project_name
  org_id = var.atlas_org_id
}

resource "mongodbatlas_advanced_cluster" "cluster" {
  project_id               = mongodbatlas_project.project.id
  name                     = var.atlas_cluster_name
  cluster_type             = "REPLICASET"

  replication_specs = [{
    region_configs = [{
      provider_name = "TENANT"
      backing_provider_name       = "AZURE"
      region_name   = var.atlas_region
      priority      = 7

      electable_specs = {
        instance_size = "M0"
      }
    }]
  }]
}

resource "random_password" "db_user_password" {
  length           = 24
  special          = true
  override_special = "_%@"
}

resource "mongodbatlas_database_user" "app" {
  project_id         = mongodbatlas_project.project.id
  username           = var.app_db_user
  password           = random_password.db_user_password.result
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = var.app_db_name
  }

  scopes {
    name = mongodbatlas_advanced_cluster.cluster.name
    type = "CLUSTER"
  }
}

resource "mongodbatlas_project_ip_access_list" "app" {
  project_id = mongodbatlas_project.project.id
  cidr_block = var.app_access_cidr
  comment    = "App access"
}
