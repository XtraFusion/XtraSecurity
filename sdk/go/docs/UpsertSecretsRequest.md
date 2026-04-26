# UpsertSecretsRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Secrets** | Pointer to **map[string]string** |  | [optional] 
**Branch** | Pointer to **string** |  | [optional] [default to "main"]
**ExpectedVersions** | Pointer to **map[string]string** | For optimistic locking. Map of key to expected current version. | [optional] 

## Methods

### NewUpsertSecretsRequest

`func NewUpsertSecretsRequest() *UpsertSecretsRequest`

NewUpsertSecretsRequest instantiates a new UpsertSecretsRequest object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewUpsertSecretsRequestWithDefaults

`func NewUpsertSecretsRequestWithDefaults() *UpsertSecretsRequest`

NewUpsertSecretsRequestWithDefaults instantiates a new UpsertSecretsRequest object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetSecrets

`func (o *UpsertSecretsRequest) GetSecrets() map[string]string`

GetSecrets returns the Secrets field if non-nil, zero value otherwise.

### GetSecretsOk

`func (o *UpsertSecretsRequest) GetSecretsOk() (*map[string]string, bool)`

GetSecretsOk returns a tuple with the Secrets field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSecrets

`func (o *UpsertSecretsRequest) SetSecrets(v map[string]string)`

SetSecrets sets Secrets field to given value.

### HasSecrets

`func (o *UpsertSecretsRequest) HasSecrets() bool`

HasSecrets returns a boolean if a field has been set.

### GetBranch

`func (o *UpsertSecretsRequest) GetBranch() string`

GetBranch returns the Branch field if non-nil, zero value otherwise.

### GetBranchOk

`func (o *UpsertSecretsRequest) GetBranchOk() (*string, bool)`

GetBranchOk returns a tuple with the Branch field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetBranch

`func (o *UpsertSecretsRequest) SetBranch(v string)`

SetBranch sets Branch field to given value.

### HasBranch

`func (o *UpsertSecretsRequest) HasBranch() bool`

HasBranch returns a boolean if a field has been set.

### GetExpectedVersions

`func (o *UpsertSecretsRequest) GetExpectedVersions() map[string]string`

GetExpectedVersions returns the ExpectedVersions field if non-nil, zero value otherwise.

### GetExpectedVersionsOk

`func (o *UpsertSecretsRequest) GetExpectedVersionsOk() (*map[string]string, bool)`

GetExpectedVersionsOk returns a tuple with the ExpectedVersions field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetExpectedVersions

`func (o *UpsertSecretsRequest) SetExpectedVersions(v map[string]string)`

SetExpectedVersions sets ExpectedVersions field to given value.

### HasExpectedVersions

`func (o *UpsertSecretsRequest) HasExpectedVersions() bool`

HasExpectedVersions returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


