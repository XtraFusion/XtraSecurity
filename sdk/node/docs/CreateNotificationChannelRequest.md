# CreateNotificationChannelRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**name** | **string** |  | [default to undefined]
**config** | **object** | Channel-specific config. For Slack: &#x60;{ webhookUrl }&#x60;. For email: &#x60;{ email }&#x60;. For webhook: &#x60;{ url }&#x60;. | [default to undefined]

## Example

```typescript
import { CreateNotificationChannelRequest } from './api';

const instance: CreateNotificationChannelRequest = {
    type,
    name,
    config,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
