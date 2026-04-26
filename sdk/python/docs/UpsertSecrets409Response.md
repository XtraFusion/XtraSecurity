# UpsertSecrets409Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**error** | **str** |  | [optional] 
**conflicts** | **List[object]** |  | [optional] 

## Example

```python
from openapi_client.models.upsert_secrets409_response import UpsertSecrets409Response

# TODO update the JSON string below
json = "{}"
# create an instance of UpsertSecrets409Response from a JSON string
upsert_secrets409_response_instance = UpsertSecrets409Response.from_json(json)
# print the JSON string representation of the object
print(UpsertSecrets409Response.to_json())

# convert the object into a dict
upsert_secrets409_response_dict = upsert_secrets409_response_instance.to_dict()
# create an instance of UpsertSecrets409Response from a dict
upsert_secrets409_response_from_dict = UpsertSecrets409Response.from_dict(upsert_secrets409_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


