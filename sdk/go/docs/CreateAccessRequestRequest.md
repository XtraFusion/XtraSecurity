# CreateAccessRequestRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Reason** | **string** |  | 
**Duration** | **int32** | Duration in minutes | 
**SecretId** | Pointer to **string** |  | [optional] 
**ProjectId** | Pointer to **string** |  | [optional] 

## Methods

### NewCreateAccessRequestRequest

`func NewCreateAccessRequestRequest(reason string, duration int32, ) *CreateAccessRequestRequest`

NewCreateAccessRequestRequest instantiates a new CreateAccessRequestRequest object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewCreateAccessRequestRequestWithDefaults

`func NewCreateAccessRequestRequestWithDefaults() *CreateAccessRequestRequest`

NewCreateAccessRequestRequestWithDefaults instantiates a new CreateAccessRequestRequest object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetReason

`func (o *CreateAccessRequestRequest) GetReason() string`

GetReason returns the Reason field if non-nil, zero value otherwise.

### GetReasonOk

`func (o *CreateAccessRequestRequest) GetReasonOk() (*string, bool)`

GetReasonOk returns a tuple with the Reason field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetReason

`func (o *CreateAccessRequestRequest) SetReason(v string)`

SetReason sets Reason field to given value.


### GetDuration

`func (o *CreateAccessRequestRequest) GetDuration() int32`

GetDuration returns the Duration field if non-nil, zero value otherwise.

### GetDurationOk

`func (o *CreateAccessRequestRequest) GetDurationOk() (*int32, bool)`

GetDurationOk returns a tuple with the Duration field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDuration

`func (o *CreateAccessRequestRequest) SetDuration(v int32)`

SetDuration sets Duration field to given value.


### GetSecretId

`func (o *CreateAccessRequestRequest) GetSecretId() string`

GetSecretId returns the SecretId field if non-nil, zero value otherwise.

### GetSecretIdOk

`func (o *CreateAccessRequestRequest) GetSecretIdOk() (*string, bool)`

GetSecretIdOk returns a tuple with the SecretId field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSecretId

`func (o *CreateAccessRequestRequest) SetSecretId(v string)`

SetSecretId sets SecretId field to given value.

### HasSecretId

`func (o *CreateAccessRequestRequest) HasSecretId() bool`

HasSecretId returns a boolean if a field has been set.

### GetProjectId

`func (o *CreateAccessRequestRequest) GetProjectId() string`

GetProjectId returns the ProjectId field if non-nil, zero value otherwise.

### GetProjectIdOk

`func (o *CreateAccessRequestRequest) GetProjectIdOk() (*string, bool)`

GetProjectIdOk returns a tuple with the ProjectId field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetProjectId

`func (o *CreateAccessRequestRequest) SetProjectId(v string)`

SetProjectId sets ProjectId field to given value.

### HasProjectId

`func (o *CreateAccessRequestRequest) HasProjectId() bool`

HasProjectId returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


