# UpsertSecrets409Response

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Error** | Pointer to **string** |  | [optional] 
**Conflicts** | Pointer to **[]interface{}** |  | [optional] 

## Methods

### NewUpsertSecrets409Response

`func NewUpsertSecrets409Response() *UpsertSecrets409Response`

NewUpsertSecrets409Response instantiates a new UpsertSecrets409Response object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewUpsertSecrets409ResponseWithDefaults

`func NewUpsertSecrets409ResponseWithDefaults() *UpsertSecrets409Response`

NewUpsertSecrets409ResponseWithDefaults instantiates a new UpsertSecrets409Response object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetError

`func (o *UpsertSecrets409Response) GetError() string`

GetError returns the Error field if non-nil, zero value otherwise.

### GetErrorOk

`func (o *UpsertSecrets409Response) GetErrorOk() (*string, bool)`

GetErrorOk returns a tuple with the Error field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetError

`func (o *UpsertSecrets409Response) SetError(v string)`

SetError sets Error field to given value.

### HasError

`func (o *UpsertSecrets409Response) HasError() bool`

HasError returns a boolean if a field has been set.

### GetConflicts

`func (o *UpsertSecrets409Response) GetConflicts() []interface{}`

GetConflicts returns the Conflicts field if non-nil, zero value otherwise.

### GetConflictsOk

`func (o *UpsertSecrets409Response) GetConflictsOk() (*[]interface{}, bool)`

GetConflictsOk returns a tuple with the Conflicts field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetConflicts

`func (o *UpsertSecrets409Response) SetConflicts(v []interface{})`

SetConflicts sets Conflicts field to given value.

### HasConflicts

`func (o *UpsertSecrets409Response) HasConflicts() bool`

HasConflicts returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


