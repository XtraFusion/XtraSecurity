# UpsertSecrets200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **bool** |  | [optional] 
**count** | **int** |  | [optional] 

## Example

```python
from openapi_client.models.upsert_secrets200_response import UpsertSecrets200Response

# TODO update the JSON string below
json = "{}"
# create an instance of UpsertSecrets200Response from a JSON string
upsert_secrets200_response_instance = UpsertSecrets200Response.from_json(json)
# print the JSON string representation of the object
print(UpsertSecrets200Response.to_json())

# convert the object into a dict
upsert_secrets200_response_dict = upsert_secrets200_response_instance.to_dict()
# create an instance of UpsertSecrets200Response from a dict
upsert_secrets200_response_from_dict = UpsertSecrets200Response.from_dict(upsert_secrets200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


