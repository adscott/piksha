n('piksha.media', function (ns) {
  ns.Thumbnail = React.createClass({
    render: function () {
      return <li className="thumbnail">
          <a href="#" onClick={this.props.clickHandler}>
            <div className="frame">
              <ns.Image url={this.props.src} className="" />
            </div>
            <span>{this.props.title}</span>
          </a>
      </li>;
    }
  });
});
