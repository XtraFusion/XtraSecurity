# CreateAccessRequestRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**reason** | **str** |  | 
**duration** | **int** | Duration in minutes | 
**secret_id** | **str** |  | [optional] 
**project_id** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.create_access_request_request import CreateAccessRequestRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CreateAccessRequestRequest from a JSON string
create_access_request_request_instance = CreateAccessRequestRequest.from_json(json)
# print the JSON string representation of the object
print(CreateAccessRequestRequest.to_json())

# convert the object into a dict
create_access_request_request_dict = create_access_request_request_instance.to_dict()
# create an instance of CreateAccessRequestRequest from a dict
create_access_request_request_from_dict = CreateAccessRequestRequest.from_dict(create_access_request_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


