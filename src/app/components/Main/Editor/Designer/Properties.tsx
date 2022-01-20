/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Col, Row } from 'react-bootstrap';
import Panel from './Panel';
import AlignRadioButtons from './AlignRadioButtons';
import TransformRadioButtons from './TransformRadioButtons';
import ColorRadioButtons from './ColorRadioButtons';
import BtnRadioButtons from './BtnRadioButtons';
import FormatButtons from './FormatButtons';
import Switch from './Switch';
import PropertiesInput from './PropertiesInput';
import { getInitialTagValue } from 'lib/constructor/properties';
import resolveTagHandler from 'lib/constructor/tags';
import { params } from 'lib/constructor/tags/params';

interface IPropertiesProps {
  changePage?: any;
  tag?: any;
}

interface IPropertiesState {}

export default class Properties extends React.Component<
  IPropertiesProps,
  IPropertiesState
> {
  onChange(attr: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (this.props && this.props.tag) {
      this.props.changePage({
        attrName: attr,
        attrValue: e.target.value,
        tagID: this.props.tag.id
      });
    }
  }

  onAttrChange(attr: string, value: string) {
    if (this.props && this.props.tag) {
      this.props.changePage({
        attrName: attr,
        attrValue: value,
        tagID: this.props.tag.id
      });
    }
  }

  onToggleFormat(format: string) {
    if (format === 'removeFormat') {
      this.props.changePage({
        text: this.props.tag.childrenText.replace(/<\/?[^>]+(>|$)/g, ''),
        tagID: this.props.tag.id
      });
    } else {
      document.execCommand(format);
    }
  }

  getExtraParams() {
    const Handler = resolveTagHandler(this.props.tag.tag);
    const Tag = new Handler(this.props.tag);

    let result = [];
    for (let attr in params) {
      if (
        params.hasOwnProperty(attr) &&
        Tag.hasEditProp(attr) &&
        attr !== 'class' &&
        attr !== 'align' &&
        attr !== 'transform' &&
        attr !== 'wrap' &&
        attr !== 'btn'
      ) {
        result.push({ attr: attr, name: params[attr] });
      }
    }
    return result;
  }

  renderParams() {
    return this.getExtraParams().map((attr, index) => (
      <PropertiesInput
        name={attr.attr}
        title={attr.name}
        placeholder={attr.name}
        value={
          (this.props.tag &&
            this.props.tag.attr &&
            this.props.tag.attr[attr.attr]) ||
          ''
        }
        onChange={this.onChange.bind(this, attr.attr)}
        key={index}
      />
    ));
  }

  render() {
    const Handler =
      (this.props.tag && resolveTagHandler(this.props.tag.tag)) || null;
    if (Handler) {
      const Tag = new Handler(this.props.tag);

      return (
        <Panel title="Properties">
          <div className="content-wrapper b-panel-light">
            <form className="form-horizontal">
              <PropertiesInput
                name="tag"
                title="Tag"
                placeholder="Tag name"
                value={(this.props.tag && this.props.tag.tag) || ''}
                readOnly={true}
              />
              <PropertiesInput
                name="id"
                title="ID"
                placeholder="Element ID"
                value={(this.props.tag && this.props.tag.id) || ''}
                readOnly={true}
              />
              {Tag.hasEditProp('class') && (
                <PropertiesInput
                  name="class"
                  title="CSS CLASS"
                  placeholder="Element Classes"
                  value={
                    (this.props.tag &&
                      this.props.tag.attr &&
                      this.props.tag.attr.class) ||
                    ''
                  }
                  onChange={this.onChange.bind(this, 'class')}
                />
              )}
            </form>
          </div>
          <div className="content-wrapper" />
          <div className="content-wrapper b-panel-light">
            <Row className="g-padding-bottom hidden">
              <Col xs={3} className="text-uppercase">
                position
              </Col>
              <Col xs={9}>
                <div className="b-position-bullet b-position-bullet_selected" />
                <div className="b-position-bullet b-position-bullet_selected" />
                <div className="b-position-bullet b-position-bullet_selected" />
                <div className="b-position-bullet b-position-bullet_selected" />
                <div className="b-position-bullet b-position-bullet_selected" />
                <div className="b-position-bullet b-position-bullet_selected" />
                <div className="b-position-bullet" />
                <div className="b-position-bullet" />
                <div className="b-position-bullet" />
                <div className="b-position-bullet" />
                <div className="b-position-bullet" />
                <div className="b-position-bullet" />
              </Col>
            </Row>
            <form className="form-horizontal">{this.renderParams()}</form>
            <Row className="g-padding-bottom">
              {Tag.hasEditProp('align') && (
                <Col xs={4} className="text-center">
                  <div className="text-uppercase">alignment</div>
                  <AlignRadioButtons
                    initialValue={getInitialTagValue(
                      'align',
                      this.props && this.props.tag
                    )}
                    onSelect={this.onAttrChange.bind(this, 'align')}
                  />
                </Col>
              )}
              {Tag.hasEditProp('transform') && (
                <Col xs={4} className="text-center">
                  <div className="text-uppercase">transform</div>
                  <TransformRadioButtons
                    initialValue={getInitialTagValue(
                      'transform',
                      this.props && this.props.tag
                    )}
                    onSelect={this.onAttrChange.bind(this, 'transform')}
                  />
                </Col>
              )}
              {Tag.hasEditProp('wrap') && (
                <Col xs={4} className="text-center">
                  <div className="text-center text-uppercase">no wrap</div>
                  <Switch
                    initialValue={getInitialTagValue(
                      'wrap',
                      this.props && this.props.tag
                    )}
                    onValue="nowrap"
                    offValue=""
                    onChange={this.onAttrChange.bind(this, 'wrap')}
                  />
                </Col>
              )}
            </Row>
            <Row className="g-padding-bottom">
              {Tag.hasEditProp('btn') && (
                <div>
                  <Col xs={12}>
                    <div className="text-uppercase">button</div>
                  </Col>
                  <Col xs={12}>
                    <BtnRadioButtons
                      initialValue={getInitialTagValue(
                        'btn',
                        this.props && this.props.tag
                      )}
                      onSelect={this.onAttrChange.bind(this, 'btn')}
                    />
                  </Col>
                </div>
              )}
              {Tag.hasEditProp('color') && (
                <div>
                  <Col xs={12}>
                    <div className="text-uppercase">color</div>
                  </Col>
                  <Col xs={12}>
                    <ColorRadioButtons
                      initialValue={getInitialTagValue(
                        'color',
                        this.props && this.props.tag
                      )}
                      onSelect={this.onAttrChange.bind(this, 'color')}
                    />
                  </Col>
                </div>
              )}
            </Row>
            {this.props.tag &&
              this.props.tag.childrenText !== null &&
              this.props.tag.childrenText !== undefined &&
              this.props.tag.childrenText.length >= 0 && (
                <Row className="g-padding-bottom">
                  <Col xs={12}>
                    <FormatButtons
                      tag={this.props.tag.tag}
                      onClick={this.onToggleFormat.bind(this)}
                    />
                  </Col>
                </Row>
              )}
          </div>
        </Panel>
      );
    } else {
      return <Panel title="Properties" />;
    }
  }
}
