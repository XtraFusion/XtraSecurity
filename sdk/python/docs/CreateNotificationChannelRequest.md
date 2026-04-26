# CreateNotificationChannelRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**name** | **str** |  | 
**config** | **object** | Channel-specific config. For Slack: &#x60;{ webhookUrl }&#x60;. For email: &#x60;{ email }&#x60;. For webhook: &#x60;{ url }&#x60;. | 

## Example

```python
from openapi_client.models.create_notification_channel_request import CreateNotificationChannelRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CreateNotificationChannelRequest from a JSON string
create_notification_channel_request_instance = CreateNotificationChannelRequest.from_json(json)
# print the JSON string representation of the object
print(CreateNotificationChannelRequest.to_json())

# convert the object into a dict
create_notification_channel_request_dict = create_notification_channel_request_instance.to_dict()
# create an instance of CreateNotificationChannelRequest from a dict
create_notification_channel_request_from_dict = CreateNotificationChannelRequest.from_dict(create_notification_channel_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


