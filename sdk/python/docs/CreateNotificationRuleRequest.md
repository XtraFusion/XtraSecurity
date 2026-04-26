# CreateNotificationRuleRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**triggers** | **List[str]** |  | 
**channels** | **List[str]** |  | 
**conditions** | **object** |  | [optional] 

## Example

```python
from openapi_client.models.create_notification_rule_request import CreateNotificationRuleRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CreateNotificationRuleRequest from a JSON string
create_notification_rule_request_instance = CreateNotificationRuleRequest.from_json(json)
# print the JSON string representation of the object
print(CreateNotificationRuleRequest.to_json())

# convert the object into a dict
create_notification_rule_request_dict = create_notification_rule_request_instance.to_dict()
# create an instance of CreateNotificationRuleRequest from a dict
create_notification_rule_request_from_dict = CreateNotificationRuleRequest.from_dict(create_notification_rule_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


