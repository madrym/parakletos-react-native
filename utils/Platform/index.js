/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Platform = {
  OS: 'web',
  select: function(obj) {
    if (obj == null) {
      return null;
    }
    return 'web' in obj ? obj.web : obj.default;
  },
  get isTesting() {
    return process.env.NODE_ENV === 'test';
  },
  get isTV() {
    return false;
  },
  get Version() {
    return '1.0.0';
  },
};

module.exports = Platform; 