# CreateBranchRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**project_id** | **str** |  | 

## Example

```python
from openapi_client.models.create_branch_request import CreateBranchRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CreateBranchRequest from a JSON string
create_branch_request_instance = CreateBranchRequest.from_json(json)
# print the JSON string representation of the object
print(CreateBranchRequest.to_json())

# convert the object into a dict
create_branch_request_dict = create_branch_request_instance.to_dict()
# create an instance of CreateBranchRequest from a dict
create_branch_request_from_dict = CreateBranchRequest.from_dict(create_branch_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


