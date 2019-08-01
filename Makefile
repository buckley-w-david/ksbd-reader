all: ksbd-reader.xpi

ksbd-reader.xpi: ksbd-reader.js manifest.json
	zip -r ksbd-reader.xpi icons ksbd-reader.js manifest.json
