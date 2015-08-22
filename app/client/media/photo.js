n('piksha.media', function (ns) {
  ns.Photo = React.createClass({
    showAlbum: function (e) {
      e.preventDefault();
      piksha.application.Router.instance().changeRoute('album', {albumUrl: this.props.albumUrl});
    },
    render: function () {
      return <div>
          <nav>
            <a href="#" onClick={this.showAlbum}>Back</a>
          </nav>
          <div className="main">
            <img src={this.props.photo.full} />
          </div>
          <h3 className="caption">{this.props.photo.title}</h3>
        </div>;
    }
  });
});
