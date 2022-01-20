/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as _ from 'lodash';
import SourceElement from './SourceElement';
import CollapsedListItem from './CollapsedListItem';
import styled from 'styled-components';

import imgGroup2 from 'images/constructor/group-36.svg';
import imgGroup11 from 'images/constructor/group-11.svg';
import imgGroup12 from 'images/constructor/group-12.svg';
import imgGroup13 from 'images/constructor/group-13.svg';
import imgGroup34 from 'images/constructor/group-34.svg';
import imgGroup35 from 'images/constructor/group-35.svg';

const CategoryList = styled.div`
  .b-category-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .b-category-list > li {
    min-height: 30px;
    max-height: 500px;
    line-height: 30px;
    background-color: #707c91;
    border-top: 1px solid #626c7e;
    border-bottom: 1px solid #818c9f;
    font-size: 14px;
    font-weight: 900;
    color: #ffffff;
    font-family: 'Avenir', 'Source Sans Pro', sans-serif;
    text-transform: uppercase;
    overflow: hidden;
    transition: all 0.5s ease-in-out;
  }

  .b-category-list > li.collapsed {
    max-height: 30px;
  }

  .b-category-list > li > div {
    padding-left: 20px;
    cursor: pointer;
  }

  .b-category-list > li > div > img {
    margin-right: 8px;
    position: relative;
    top: -2px;
  }

  .b-category-list > li:first-child {
    border-top: none;
  }

  .b-category-list > li:last-child {
    border-bottom: none;
  }

  .b-category-sublist {
    margin: 0;
    padding: 0;
    list-style: none;
    background-color: #465669;
  }

  .b-category-sublist > li {
    text-transform: capitalize;
    position: relative;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Avenir', 'Source Sans Pro', sans-serif;
    line-height: 30px;
    padding-left: 45px;
    cursor: move;
  }

  .b-category-sublist > li:hover {
    background-color: #596d85;
  }

  .b-category-sublist > li:before {
    display: block;
    content: '';
    position: absolute;
    top: 50%;
    left: 30px;
    width: 6px;
    height: 6px;
    margin-top: -3px;
    background-color: #8399b0;
    border-radius: 2px;
  }
`;

interface ISourceElementsProps {
  search?: boolean;
}

interface ISourceElementsState {
  searchText: string;
}

interface IItem {
  text: string;
  element?: string;
  template?: string;
}

class SourceElements extends React.Component<
  ISourceElementsProps,
  ISourceElementsState
> {
  private groups: {
    text: string;
    icon: string;
    items: IItem[];
  }[];
  constructor(props: ISourceElementsProps) {
    super(props);
    this.state = {
      searchText: ''
    };

    this.groups = [
      {
        text: 'Structure',
        icon: imgGroup11,
        items: [
          {
            text: 'Form with header',
            template: 'formWithHeader'
          },
          {
            text: 'Table with header',
            template: 'tableWithHeader'
          },
          {
            text: 'Search form',
            template: 'searchForm'
          },
          {
            text: 'Radio panel',
            template: 'radioPanel'
          },
          {
            text: 'Div',
            element: 'div'
          }
        ]
      },
      {
        text: 'Text',
        icon: imgGroup12,
        items: [
          {
            text: 'Paragraph',
            element: 'p'
          },
          {
            text: 'Span',
            element: 'span'
          },
          {
            text: 'Strong',
            element: 'strong'
          },
          {
            text: 'Emphasize',
            element: 'em'
          },
          {
            text: 'Hint',
            element: 'hint'
          }
        ]
      },
      {
        text: 'Forms',
        icon: imgGroup34,
        items: [
          {
            text: 'Form',
            element: 'form'
          },
          {
            text: 'Input',
            element: 'input'
          },
          {
            text: 'RadioGroup',
            element: 'radiogroup'
          },
          {
            text: 'Label',
            element: 'label'
          },
          {
            text: 'Button',
            element: 'button'
          },
          {
            text: 'Image input',
            element: 'imageinput'
          }
        ]
      },
      {
        text: 'Image',
        icon: imgGroup35,
        items: [
          {
            text: 'Image',
            element: 'image'
          }
        ]
      },
      {
        text: 'Tables',
        icon: imgGroup13,
        items: [
          {
            text: 'Table',
            element: 'table'
          }
        ]
      },
      {
        text: 'Logic',
        icon: imgGroup2,
        items: [
          {
            text: 'If .. Else',
            element: 'if'
          }
        ]
      }
    ];
  }
  onSearchTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      searchText: e.target.value
    });
  }
  render() {
    if (this.props.search) {
      let items: IItem[] = [];

      for (const group of this.groups) {
        items = items.concat(group.items);
      }

      items = _.sortBy(items, ['text']);

      if (this.state.searchText !== '') {
        const searchText = this.state.searchText.replace(/[^0-9a-zA-Z ]/g, '');
        if (searchText !== this.state.searchText) {
          this.setState({
            searchText: searchText
          });
        }
        items = _.filter(items, (item) =>
          new RegExp('^' + searchText + '| ' + searchText, 'ig').test(item.text)
        );
      }

      return (
        <CategoryList>
          <form className="form-horizontal b-panel-light">
            <input
              type="text"
              className="form-control input-sm "
              placeholder="Search..."
              value={this.state.searchText}
              onChange={this.onSearchTextChange.bind(this)}
            />
          </form>
          <ul className="b-category-sublist">
            {items.map((item) =>
              item.element ? (
                <SourceElement
                  text={item.text}
                  element={item.element}
                  key={item.element}
                />
              ) : (
                <SourceElement
                  text={item.text}
                  template={item.template}
                  key={item.template}
                />
              )
            )}
          </ul>
        </CategoryList>
      );
    }

    return (
      <CategoryList>
        <ul className="b-category-list">
          {this.groups.map((group) => (
            <CollapsedListItem
              text={group.text}
              icon={group.icon}
              key={group.text}
            >
              <ul className="b-category-sublist">
                {group.items.map((item) =>
                  item.element ? (
                    <SourceElement
                      text={item.text}
                      element={item.element}
                      key={item.element}
                    />
                  ) : (
                    <SourceElement
                      text={item.text}
                      template={item.template}
                      key={item.template}
                    />
                  )
                )}
              </ul>
            </CollapsedListItem>
          ))}
        </ul>
      </CategoryList>
    );
  }
}

export default SourceElements;
