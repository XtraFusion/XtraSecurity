# CreateTeamRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Name** | **string** |  | 
**Description** | Pointer to **string** |  | [optional] 
**TeamColor** | Pointer to **string** |  | [optional] 

## Methods

### NewCreateTeamRequest

`func NewCreateTeamRequest(name string, ) *CreateTeamRequest`

NewCreateTeamRequest instantiates a new CreateTeamRequest object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewCreateTeamRequestWithDefaults

`func NewCreateTeamRequestWithDefaults() *CreateTeamRequest`

NewCreateTeamRequestWithDefaults instantiates a new CreateTeamRequest object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetName

`func (o *CreateTeamRequest) GetName() string`

GetName returns the Name field if non-nil, zero value otherwise.

### GetNameOk

`func (o *CreateTeamRequest) GetNameOk() (*string, bool)`

GetNameOk returns a tuple with the Name field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetName

`func (o *CreateTeamRequest) SetName(v string)`

SetName sets Name field to given value.


### GetDescription

`func (o *CreateTeamRequest) GetDescription() string`

GetDescription returns the Description field if non-nil, zero value otherwise.

### GetDescriptionOk

`func (o *CreateTeamRequest) GetDescriptionOk() (*string, bool)`

GetDescriptionOk returns a tuple with the Description field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDescription

`func (o *CreateTeamRequest) SetDescription(v string)`

SetDescription sets Description field to given value.

### HasDescription

`func (o *CreateTeamRequest) HasDescription() bool`

HasDescription returns a boolean if a field has been set.

### GetTeamColor

`func (o *CreateTeamRequest) GetTeamColor() string`

GetTeamColor returns the TeamColor field if non-nil, zero value otherwise.

### GetTeamColorOk

`func (o *CreateTeamRequest) GetTeamColorOk() (*string, bool)`

GetTeamColorOk returns a tuple with the TeamColor field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTeamColor

`func (o *CreateTeamRequest) SetTeamColor(v string)`

SetTeamColor sets TeamColor field to given value.

### HasTeamColor

`func (o *CreateTeamRequest) HasTeamColor() bool`

HasTeamColor returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


