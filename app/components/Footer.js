import React, {Component} from 'react';

import {View, Tile, Caption} from '@shoutem/ui';

export class Footer extends Component {
  render() {
    const isHermes =
      global.HermesInternal != null ? 'Hermes: enabled' : 'Hermes: disabled';

    return (
      <View>
        <Tile styleName="text-centric md-gutter clear">
          <Caption styleName="sm-gutter-top">
            Ver 0.0.1 ALPHA | {isHermes}
          </Caption>
        </Tile>
      </View>
    );
  }
}
