# CreateNotificationRuleRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** |  | [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**triggers** | **Array&lt;string&gt;** |  | [default to undefined]
**channels** | **Array&lt;string&gt;** |  | [default to undefined]
**conditions** | **object** |  | [optional] [default to undefined]

## Example

```typescript
import { CreateNotificationRuleRequest } from './api';

const instance: CreateNotificationRuleRequest = {
    name,
    description,
    triggers,
    channels,
    conditions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
