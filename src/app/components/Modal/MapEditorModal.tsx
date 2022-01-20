/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { List } from 'immutable';
import { FormattedMessage } from 'react-intl';
import { Button } from 'react-bootstrap';
import { IMapEditorEvent, TMapEditorType } from 'ibax/geo';
import themed from 'components/Theme/themed';
import { loadModules } from 'esri-loader';
import Autosuggest, { GetSuggestionValue, SuggestionsFetchRequested, ChangeEvent, OnSuggestionSelected } from 'react-autosuggest';

import Modal, { IModalProps } from './';
import Validation from 'components/Validation';
import MapView from 'components/Map/MapView';
import Tooltip from 'components/Tooltip';
import SegmentButton from 'components/Button/SegmentButton';

export interface IMapEditorModalProps {
    mapType?: 'streets' | 'satellite' | 'hybrid' | 'topo' | 'gray' | 'dark-gray' | 'oceans' | 'national-geographic' | 'terrain' | 'osm';
    tool?: TMapEditorType;
    coords: [number, number][];
    center?: [number, number];
    zoom?: number;
}

interface IMapEditorModalState {
    search: string;
    tool: TMapEditorType;
    points: List<[number, number]>;
    area: number;
    pending: boolean;
    address: string;
    center?: [number, number];
    suggestions: ISuggestion[];
}

interface ISuggestion {
    address: string;
    location: [number, number];
}

export const PlacesAutocompleteList = themed.div`
    position: relative;

    .react-autosuggest__suggestions-list {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: #fff;
        z-index: 10;
        list-style-type: none;
        padding: 0;
        margin: 0;
        border-right: 1px solid #66afe9;
        border-left: 1px solid #66afe9;
        border-bottom: 1px solid #66afe9;
    }
    
    .react-autosuggest__suggestion {
        padding: 10px;
    }
    
    .react-autosuggest__suggestion--highlighted {
        background: #fafafa;
        cursor: pointer;
    }
    
    .places-autocomplete-container__item__description {
        color: red !important;
    }
`;

interface IToolButtonProps {
    tooltip: JSX.Element;
    onClick: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
    className?: string;
    disabled?: boolean;
}

const ToolButton: React.SFC<IToolButtonProps> = props => (
    <div className="mr" style={{ display: 'inline-block' }}>
        <Tooltip body={props.tooltip}>
            <button type="button" className="btn btn-icon" onClick={props.onClick} disabled={props.disabled}>
                <span className={`btn-label ${props.className || ''}`} />
            </button>
        </Tooltip>
    </div>
);

const mapTools = ['point', 'line', 'polygon'];

class MapEditorModal extends Modal<IMapEditorModalProps, IMapEditorEvent, IMapEditorModalState> {
    private _isMounted = false;

    constructor(props: any) {
        super(props);
        this.state = {
            points: List(),
            tool: props.params.tool || 'point',
            area: 0,
            pending: false,
            address: '',
            search: '',
            center: props.params.center,
            suggestions: []
        };
    }

    componentDidMount() {
        this._isMounted = true;
        this.initialize(this.props);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    componentWillReceiveProps(props: IModalProps<IMapEditorModalProps, IMapEditorEvent>) {
        this.initialize(props);
    }

    initialize(props: IModalProps<IMapEditorModalProps, IMapEditorEvent>) {
        this.setState({
            points: List(props.params.coords || [])
        });
    }

    calcResult(coords: [number, number][], onResult: (result: string) => void) {
        loadModules(['esri/tasks/Locator', 'esri/geometry/Polygon']).then((deps: [__esri.LocatorConstructor, __esri.PolygonConstructor]) => {
            const [Locator, Polygon] = deps;
            const locator = new Locator({
                url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'
            });
            const centerPoint = new Polygon({
                rings: [coords]
            }).centroid;

            locator.locationToAddress(centerPoint).then(result => {
                onResult(result.address || '');
            }).catch(e => {
                onResult('');
            });

        }).catch(e => {
            onResult('');
        });
    }

    onSuccess = (values: { [key: string]: any }) => {
        this.setState({
            pending: true
        });

        const points = this.state.points.toArray();

        this.calcResult(points, result => {
            if (this._isMounted) {
                this.props.onResult({
                    type: this.state.tool,
                    coords: this.state.points.toArray(),
                    area: this.state.area,
                    address: result
                });
                this.setState({
                    pending: false
                });
            }
        });
    }

    onClick = (e: __esri.MapViewClickEvent) => {
        const points = 'point' === this.state.tool ?
            List<[number, number]>([[e.mapPoint.longitude, e.mapPoint.latitude]]) :
            this.state.points.push([e.mapPoint.longitude, e.mapPoint.latitude]);

        this.setState({
            points
        });
    }

    onUndo = () => {
        const points = this.state.points.pop();

        this.setState({
            points
        });
    }

    onClear = () => {
        this.setState({
            points: List<[number, number]>()
        });
    }

    onAreaChange = (area: number) => {
        this.setState({
            area
        });
    }

    onChange = (event: React.FormEvent<any>, params: ChangeEvent) => {
        this.setState({
            search: params.newValue
        });
    }

    onSuggestionSelected: OnSuggestionSelected<ISuggestion> = (e, data) => {
        this.setState({
            address: data.suggestion.address,
            center: data.suggestion.location
        });
    }

    getSuggestionValue: GetSuggestionValue<ISuggestion> = suggestion => {
        return suggestion.address;
    }

    onSuggestionsFetchRequested: SuggestionsFetchRequested = ({ value }) => {
        loadModules(['esri/tasks/Locator']).then((deps: [__esri.LocatorConstructor]) => {
            const [Locator] = deps;

            const locator = new Locator({
                url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'
            });

            locator.addressToLocations({
                address: {
                    SingleLine: value,
                    SingleLineFieldName: value
                },
                maxLocations: 5

            } as any).then(result => {
                if (this._isMounted) {
                    this.setState({
                        suggestions: result.map(l => ({
                            address: l.address,
                            location: [l.location.longitude, l.location.latitude] as [number, number]
                        }))
                    });
                }
            });

        }).catch(err => { /* Silently suppress errors */ });
    }

    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    }

    onToolChange = (index: number) => {
        this.setState({
            tool: mapTools[index] as any,
            points: List<[number, number]>()
        });
    }

    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="map.editor" defaultMessage="Map editor" />
                </Modal.Header>
                <Modal.Body style={{ paddingBottom: 0 }}>
                    <PlacesAutocompleteList>
                        <Autosuggest
                            suggestions={this.state.suggestions}
                            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                            onSuggestionSelected={this.onSuggestionSelected}
                            getSuggestionValue={this.getSuggestionValue}
                            renderSuggestionsContainer={params => (
                                <PlacesAutocompleteList {...params.containerProps}>
                                    {params.children}
                                </PlacesAutocompleteList>
                            )}
                            renderSuggestion={(suggestion, params) => (
                                <div
                                    key={suggestion.address}
                                    className={params.isHighlighted ? 'places-autocomplete-container__item places-autocomplete-container__item_active' : 'places-autocomplete-container__item'}
                                >
                                    {suggestion.address}
                                </div>
                            )}
                            inputProps={{
                                placeholder: '',
                                value: this.state.search,
                                onChange: this.onChange,
                                className: 'form-control'
                            }}
                        />
                    </PlacesAutocompleteList>
                </Modal.Body>
                <Validation.components.ValidatedForm onSubmitSuccess={this.onSuccess}>
                    <Modal.Body style={{ paddingTop: 0 }}>
                        <div style={{ minWidth: 500, width: '60%' }}>
                            <div className="mt">
                                <MapView
                                    height={400}
                                    tool={this.state.tool}
                                    center={this.state.center}
                                    zoom={this.props.params.zoom}
                                    mapType={this.props.params.mapType}
                                    onClick={this.onClick}
                                    coords={this.state.points.toArray()}
                                    onAreaChange={this.onAreaChange}
                                />
                            </div>
                        </div>
                        <div className="mt text-center clearfix" style={{ position: 'relative' }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div className="pull-right">
                                    <FormattedMessage id="map.area" defaultMessage="Area: {value}" values={{ value: this.state.area.toFixed(2) }} />
                                    <span>&nbsp;</span>
                                    <span className="text-muted">
                                        <FormattedMessage id="map.meter.short" defaultMessage="m" /><sup>2</sup>
                                    </span>
                                </div>
                                <div className="pull-left">
                                    <ToolButton
                                        tooltip={<FormattedMessage id="undo" defaultMessage="Undo" />}
                                        onClick={this.onUndo}
                                        disabled={0 === this.state.points.count()}
                                        className="fa fa-undo"
                                    />
                                    <ToolButton
                                        tooltip={<FormattedMessage id="clear" defaultMessage="Clear" />}
                                        onClick={this.onClear}
                                        disabled={0 === this.state.points.count()}
                                        className="fa fa-trash"
                                    />
                                </div>
                            </div>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, textAlign: 'center', zIndex: 0 }}>
                                <SegmentButton
                                    activeIndex={mapTools.indexOf(this.state.tool)}
                                    onChange={this.onToolChange}
                                    items={[
                                        <FormattedMessage key="point" id="map.tool.point" defaultMessage="Point" />,
                                        <FormattedMessage key="line" id="map.tool.line" defaultMessage="Line" />,
                                        <FormattedMessage key="polygon" id="map.tool.polygon" defaultMessage="Polygon" />
                                    ]}
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="text-right">
                        <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                        </Button>
                        <Validation.components.ValidatedSubmit bsStyle="primary" disabled={this.state.pending}>
                            <FormattedMessage id="confirm" defaultMessage="Confirm" />
                        </Validation.components.ValidatedSubmit>
                    </Modal.Footer>
                </Validation.components.ValidatedForm>
            </div>
        );
    }
}
export default MapEditorModal;