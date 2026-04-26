# UpsertSecretsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**secrets** | **Dict[str, str]** |  | [optional] 
**branch** | **str** |  | [optional] [default to 'main']
**expected_versions** | **Dict[str, str]** | For optimistic locking. Map of key to expected current version. | [optional] 

## Example

```python
from openapi_client.models.upsert_secrets_request import UpsertSecretsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of UpsertSecretsRequest from a JSON string
upsert_secrets_request_instance = UpsertSecretsRequest.from_json(json)
# print the JSON string representation of the object
print(UpsertSecretsRequest.to_json())

# convert the object into a dict
upsert_secrets_request_dict = upsert_secrets_request_instance.to_dict()
# create an instance of UpsertSecretsRequest from a dict
upsert_secrets_request_from_dict = UpsertSecretsRequest.from_dict(upsert_secrets_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


