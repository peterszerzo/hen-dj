onmessage = (ev) => {
  const arrayBuffer = ev.data;

  new OfflineAudioContext().decodeAudioData(arrayBuffer).then((buffer) => {
    // Create offline context
    const offlineContext = new OfflineAudioContext(
      1,
      buffer.length,
      buffer.sampleRate
    );

    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Create filter
    const filter = offlineContext.createBiquadFilter();
    filter.type = "lowpass";

    // Pipe the song into the filter, and the filter into the offline context
    source.connect(filter);
    filter.connect(offlineContext.destination);

    // Schedule the song to start playing at time:0
    source.start(300);

    // Render the song
    offlineContext.startRendering();

    // Act on the result
    offlineContext.oncomplete = function (event) {
      // Filtered buffer!
      const filteredBuffer = event.renderedBuffer;
      const data = filteredBuffer.getChannelData(0);
      const peaks = getPeaks(data);

      postMessage(peaks);
    };
  });
};

function getPeaks(data) {
  // What we're going to do here, is to divide up our audio into parts.

  // We will then identify, for each part, what the loudest sample is in that
  // part.

  // It's implied that that sample would represent the most likely 'beat'
  // within that part.

  // Each part is 0.5 seconds long - or 22,050 samples.

  // This will give us 60 'beats' - we will only take the loudest half of
  // those.

  // This will allow us to ignore breaks, and allow us to address tracks with
  // a BPM below 120.

  var partSize = 22050,
    parts = data.length / partSize,
    peaks = [];

  for (var i = 0; i < parts; i++) {
    var max = 0;
    for (var j = i * partSize; j < (i + 1) * partSize; j++) {
      var volume = Math.max(Math.abs(data[j]));
      if (!max || volume > max.volume) {
        max = {
          position: j,
          volume: volume,
        };
      }
    }
    peaks.push(max);
  }

  // We then sort the peaks according to volume...

  peaks.sort(function (a, b) {
    return b.volume - a.volume;
  });

  // ...take the loundest half of those...

  peaks = peaks.splice(0, peaks.length * 0.5);

  // ...and re-sort it back based on position.

  peaks.sort(function (a, b) {
    return a.position - b.position;
  });

  return peaks;
}
