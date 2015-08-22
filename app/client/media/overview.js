n('piksha.media', function (ns) {
  ns.Overview = React.createClass({
    render: function () {
      return <div>
          <piksha.application.Greeting />
          <piksha.media.AlbumsList />
        </div>;
    }
  });
});
