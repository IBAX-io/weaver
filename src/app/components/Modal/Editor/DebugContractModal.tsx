/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button, Well, Row, Col } from 'react-bootstrap';
import { FormattedMessage, injectIntl } from 'react-intl';
import { ITransactionCollection, ITxStatus, ITxError } from 'ibax/tx';
import { TContractFieldType } from 'ibax/api';

import Modal from '../';
import Validation from 'components/Validation';
import ValidatedContractForm from 'containers/Widgets/ValidatedContractForm';
import Table, { ICellRenderer } from 'components/Table';

export interface IDebugContractModalProps {
    contract: string;
    fields: {
        name: string;
        type: TContractFieldType;
        optional?: boolean;
    }[];
}

interface IDebugContractModalState {
    pending: boolean;
    result: ITxError | ITxStatus;
}

class DebugContractModal extends Modal<IDebugContractModalProps, void, IDebugContractModalState> {
    constructor(props: any) {
        super(props);
        this.state = {
            pending: false,
            result: null
        };
    }

    mapContractParams = (payload: { [key: string]: any }) => {
        this.setState({
            pending: true
        });

        return payload;
    }

    renderParameter: ICellRenderer = (value, rowData) => {
        const field = rowData.rowData[0] as {
            name: string;
            type: TContractFieldType;
            optional?: boolean;
        };

        switch (rowData.colIndex) {
            case 0: return (
                <span className="pl">{field.name}</span>
            );

            case 1:
                return (
                    <Validation.components.ValidatedFormGroup for={field.name} className="pr">
                        {this.renderField(field.name, field.type, field.optional)}
                    </Validation.components.ValidatedFormGroup>
                );

            default: return null;
        }
    }

    onExec = (tx: ITransactionCollection) => {
        this.setState({
            pending: false,
            result: tx.error || tx.stack[0].status
        });
    }

    renderField = (name: string, type: TContractFieldType, optional?: boolean) => {
        switch (type) {
            case 'bool': return (
                <Validation.components.ValidatedCheckbox name={name} title={name} />
            );

            case 'int':
            case 'money':
            case 'float': return (
                <Validation.components.ValidatedControl name={name} type="number" validators={optional ? [] : [Validation.validators.required]} />
            );

            case 'string': return (
                <Validation.components.ValidatedControl name={name} type="text" validators={optional ? [] : [Validation.validators.required]} />
            );

            case 'file': return (
                <Validation.components.ValidatedFile name={name} />
            );

            default: return null;
        }
    }

    render() {
        return (
            <ValidatedContractForm silent contract={this.props.params.contract} contractParams={this.mapContractParams} onExec={this.onExec}>
                <Modal.Header>
                    <FormattedMessage id="contract.exec" defaultMessage="Execute contract" />
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6} style={{ width: 400 }}>
                            <Table
                                striped
                                collapse
                                renderCell={this.renderParameter}
                                columns={[
                                    { title: 'Key', width: 140 },
                                    { title: 'Value' },
                                ]}
                                data={this.props.params.fields.map((param, index) => [param])}
                            />
                        </Col>
                        <Col md={6} style={{ width: 400 }}>
                            <Well style={{ whiteSpace: 'pre-wrap' }}>
                                {this.state.pending && (
                                    <div>
                                        <FormattedMessage id="pending" defaultMessage="Pending" />
                                    </div>
                                )}
                                {!this.state.pending && (
                                    <div>
                                        {JSON.stringify(this.state.result, null, 3)}
                                    </div>
                                )}
                            </Well>
                        </Col>
                    </Row>
                </Modal.Body >
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                    </Button>
                    <Validation.components.ValidatedSubmit bsStyle="primary">
                        <FormattedMessage id="exec" defaultMessage="Exec" />
                    </Validation.components.ValidatedSubmit>
                </Modal.Footer>
            </ValidatedContractForm >
        );
    }
}
export default injectIntl(DebugContractModal);