const noop = () => () => {};
module.exports = {
  Component: noop,
  Injectable: noop,
  Input: noop,
  Output: noop,
  OnInit: class {},
};
