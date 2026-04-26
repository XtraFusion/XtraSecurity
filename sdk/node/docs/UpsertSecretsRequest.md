# UpsertSecretsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**secrets** | **{ [key: string]: string; }** |  | [optional] [default to undefined]
**branch** | **string** |  | [optional] [default to 'main']
**expectedVersions** | **{ [key: string]: string; }** | For optimistic locking. Map of key to expected current version. | [optional] [default to undefined]

## Example

```typescript
import { UpsertSecretsRequest } from './api';

const instance: UpsertSecretsRequest = {
    secrets,
    branch,
    expectedVersions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
