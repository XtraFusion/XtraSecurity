# AccessRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Id** | Pointer to **string** |  | [optional] 
**Reason** | Pointer to **string** |  | [optional] 
**Duration** | Pointer to **int32** | Duration in minutes | [optional] 
**Status** | Pointer to **string** |  | [optional] 
**RequestedAt** | Pointer to **time.Time** |  | [optional] 

## Methods

### NewAccessRequest

`func NewAccessRequest() *AccessRequest`

NewAccessRequest instantiates a new AccessRequest object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewAccessRequestWithDefaults

`func NewAccessRequestWithDefaults() *AccessRequest`

NewAccessRequestWithDefaults instantiates a new AccessRequest object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetId

`func (o *AccessRequest) GetId() string`

GetId returns the Id field if non-nil, zero value otherwise.

### GetIdOk

`func (o *AccessRequest) GetIdOk() (*string, bool)`

GetIdOk returns a tuple with the Id field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetId

`func (o *AccessRequest) SetId(v string)`

SetId sets Id field to given value.

### HasId

`func (o *AccessRequest) HasId() bool`

HasId returns a boolean if a field has been set.

### GetReason

`func (o *AccessRequest) GetReason() string`

GetReason returns the Reason field if non-nil, zero value otherwise.

### GetReasonOk

`func (o *AccessRequest) GetReasonOk() (*string, bool)`

GetReasonOk returns a tuple with the Reason field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetReason

`func (o *AccessRequest) SetReason(v string)`

SetReason sets Reason field to given value.

### HasReason

`func (o *AccessRequest) HasReason() bool`

HasReason returns a boolean if a field has been set.

### GetDuration

`func (o *AccessRequest) GetDuration() int32`

GetDuration returns the Duration field if non-nil, zero value otherwise.

### GetDurationOk

`func (o *AccessRequest) GetDurationOk() (*int32, bool)`

GetDurationOk returns a tuple with the Duration field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDuration

`func (o *AccessRequest) SetDuration(v int32)`

SetDuration sets Duration field to given value.

### HasDuration

`func (o *AccessRequest) HasDuration() bool`

HasDuration returns a boolean if a field has been set.

### GetStatus

`func (o *AccessRequest) GetStatus() string`

GetStatus returns the Status field if non-nil, zero value otherwise.

### GetStatusOk

`func (o *AccessRequest) GetStatusOk() (*string, bool)`

GetStatusOk returns a tuple with the Status field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetStatus

`func (o *AccessRequest) SetStatus(v string)`

SetStatus sets Status field to given value.

### HasStatus

`func (o *AccessRequest) HasStatus() bool`

HasStatus returns a boolean if a field has been set.

### GetRequestedAt

`func (o *AccessRequest) GetRequestedAt() time.Time`

GetRequestedAt returns the RequestedAt field if non-nil, zero value otherwise.

### GetRequestedAtOk

`func (o *AccessRequest) GetRequestedAtOk() (*time.Time, bool)`

GetRequestedAtOk returns a tuple with the RequestedAt field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRequestedAt

`func (o *AccessRequest) SetRequestedAt(v time.Time)`

SetRequestedAt sets RequestedAt field to given value.

### HasRequestedAt

`func (o *AccessRequest) HasRequestedAt() bool`

HasRequestedAt returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


