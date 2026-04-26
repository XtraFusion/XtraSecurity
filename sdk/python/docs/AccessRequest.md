# AccessRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**reason** | **str** |  | [optional] 
**duration** | **int** | Duration in minutes | [optional] 
**status** | **str** |  | [optional] 
**requested_at** | **datetime** |  | [optional] 

## Example

```python
from openapi_client.models.access_request import AccessRequest

# TODO update the JSON string below
json = "{}"
# create an instance of AccessRequest from a JSON string
access_request_instance = AccessRequest.from_json(json)
# print the JSON string representation of the object
print(AccessRequest.to_json())

# convert the object into a dict
access_request_dict = access_request_instance.to_dict()
# create an instance of AccessRequest from a dict
access_request_from_dict = AccessRequest.from_dict(access_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


