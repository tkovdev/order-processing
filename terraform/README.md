# How to Setup
## Prereqs
- install Azure CLI
- install Terraform CLI

## Steps
- <code>az login</code> & set target subscription
- create a new SP in Azure: <code>az ad sp create-for-rbac --role="Contributor" --scopes="/subscriptions/`<subscription>`"</code>


## Setting variables
- copy the required fields into a new file called `.env`
```
    TF_VAR_azure_client_id="<app_id>"
    TF_VAR_azure_client_secret="<password>"
    TF_VAR_azure_subscription_id="<subscripton_id>"
    TF_VAR_azure_tenant_id="<tenant_id>"
    TF_VAR_atlas_org_id="<atlas_org_id>"
    TF_VAR_atlas_private_key="atlas_priv_key"
    TF_VAR_atlas_public_key="atlas_pub_key"
```
- run <code>export $(cat .env | xargs)</code> to set the env vars for the terminal session (rather than setting permanently)
- to check vars were set correctly, run <code>printenv</code>

## Running TF
- <code>terraform plan</code>
- <code>terraform apply</code>
- <code>terraform destroy</code> (if needed)