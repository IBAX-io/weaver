/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { List } from 'immutable';
import { FormattedMessage } from 'react-intl';
import { Button } from 'react-bootstrap';
import { IMapEditorEvent, TMapEditorType, TMapType } from 'ibax/geo';

import Modal, { IModalProps } from './';
import Validation from 'components/Validation';
import MapView, { TMapClickEvent } from 'components/Map/MapView';
import AddressCombobox, { IAddressSuggestion } from 'components/Map/AddressCombobox';
import { addressOfShape, searchAddress } from 'components/Map/geocoder';
import Tooltip from 'components/Tooltip';
import SegmentButton from 'components/Button/SegmentButton';


export interface IMapEditorModalProps {
    mapType?: TMapType;
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
    suggestions: IAddressSuggestion[];
}

interface IToolButtonProps {
    tooltip: React.JSX.Element;
    onClick: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
    className?: string;
    disabled?: boolean;
}

const ToolButton: React.FC<React.PropsWithChildren<IToolButtonProps>> = props => (
    <div className="mr" style={{ display: 'inline-block' }}>
        <Tooltip body={props.tooltip}>
            <button type="button" className="btn btn-icon" onClick={props.onClick} disabled={props.disabled}>
                <span className={`btn-label ${props.className || ''}`} />
            </button>
        </Tooltip>
    </div>
);

const mapTools: TMapEditorType[] = ['point', 'line', 'polygon'];

type TMapEditorModalProps = IModalProps<IMapEditorModalProps, IMapEditorEvent>;

class MapEditorModal extends Modal<IMapEditorModalProps, IMapEditorEvent, IMapEditorModalState> {
    private _isMounted = false;
    private _suggestionsRequest = 0;

    constructor(props: TMapEditorModalProps) {
        super(props);
        this.state = {
            points: List(props.params.coords || []),
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
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    componentDidUpdate(prevProps: TMapEditorModalProps) {
        if (prevProps.params.coords !== this.props.params.coords) {
            this.setState({
                points: List(this.props.params.coords || [])
            });
        }
    }

    calcResult(coords: [number, number][], onResult: (result: string) => void) {
        addressOfShape(coords).then(onResult);
    }

    onSuccess = () => {
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

    onClick = (e: TMapClickEvent) => {
        const point: [number, number] = [e.mapPoint.longitude, e.mapPoint.latitude];
        const points = 'point' === this.state.tool ?
            List<[number, number]>([point]) :
            this.state.points.push(point);

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

    onSearchChange = (search: string) => {
        this.setState({
            search
        });
    }

    onSuggestionSelected = (suggestion: IAddressSuggestion) => {
        this.setState({
            address: suggestion.address,
            center: suggestion.location
        });
    }

    onSuggestionsFetchRequested = (value: string) => {
        const request = ++this._suggestionsRequest;

        searchAddress(value).then(suggestions => {
            if (this._isMounted && request === this._suggestionsRequest) {
                this.setState({ suggestions });
            }
        }).catch(() => {
            /* Geocoder unavailable: keep the current suggestions */
        });
    }

    onSuggestionsClearRequested = () => {
        this._suggestionsRequest++;
        this.setState({
            suggestions: []
        });
    }

    onToolChange = (index: number) => {
        this.setState({
            tool: mapTools[index],
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
                    <AddressCombobox
                        value={this.state.search}
                        suggestions={this.state.suggestions}
                        onChange={this.onSearchChange}
                        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                        onSuggestionSelected={this.onSuggestionSelected}
                    />
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
                                <div className="float-end">
                                    <FormattedMessage id="map.area" defaultMessage="Area: {value}" values={{ value: this.state.area.toFixed(2) }} />
                                    <span>&nbsp;</span>
                                    <span className="text-muted">
                                        <FormattedMessage id="map.meter.short" defaultMessage="m" /><sup>2</sup>
                                    </span>
                                </div>
                                <div className="float-start">
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
                    <Modal.Footer className="text-end">
                        <Button type="button" variant="link" onClick={this.props.onCancel.bind(this)}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                        </Button>
                        <Validation.components.ValidatedSubmit variant="primary" disabled={this.state.pending}>
                            <FormattedMessage id="confirm" defaultMessage="Confirm" />
                        </Validation.components.ValidatedSubmit>
                    </Modal.Footer>
                </Validation.components.ValidatedForm>
            </div>
        );
    }
}
export default MapEditorModal;