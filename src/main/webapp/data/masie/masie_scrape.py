#! /usr/bin/env python

from datetime import date, timedelta
from zipfile import ZipFile
from urllib.error import HTTPError
from urllib.request import urlopen
from io import BytesIO
from tqdm import tqdm

url = 'http://masie_web.apps.nsidc.org/pub/DATASETS/NOAA/G02186/kmz/4km/'

start = date(2006, 1, 1)
end   = date.today()
step = timedelta(days=30)

frames = []

with ZipFile('masie.kmz', 'a') as kmz:
    existing = kmz.namelist()
    day = start
    with tqdm(total = int((end - start) / step)) as bar:
        while day <= end:
            if day.timetuple().tm_year < 2015 and day.timetuple().tm_yday < 265:
                fname = '%d/masie_ice_r00_v01_%d%03d.kmz'
            else:
                fname = '%d/masie_ice_r00_v01_%d%03d_4km.kmz'

            bar.set_description(str(day))
            mfname = fname % (day.timetuple().tm_year, day.timetuple().tm_year, day.timetuple().tm_yday)
            murl = url + mfname

            png = 'masie_ice_%d%03d.png' % (day.timetuple().tm_year, day.timetuple().tm_yday)
            zname = 'images/%s' % png

            # print("fetching: %s.." % murl, end='')

            if True:
                if zname in existing:
                    frames.append((day, png))
                else:
                    try:
                        with urlopen(murl) as r:
                            # print ("downloading..", end='')
                            daykmz = BytesIO(r.read())
                            with ZipFile(daykmz, 'r') as daykmz_fd:
                                with daykmz_fd.open(png, 'r') as png_fd:
                                    kmz.writestr(zname, png_fd.read())
                            # print ("done.")

                        frames.append((day, png))
                    except HTTPError as e:
                        print ("failed downloading: %s" % murl)
                        print (e)
            else:
                frames.append((day, png))

            day = day + step
            bar.update(1)

    ## create KMZ
    with open('doc.kml', 'w') as kml:
        kml.write("""<?xml version="1.0"?>
<kml xmlns="http://earth.google.com/kml/2.2">

    <Document>
        <description>Multisensor Analyzed Sea Ice Extent - Northern Hemisphere (MASIE-NH)</description>
        <LookAt>
            <longitude>-105</longitude>
            <latitude>90</latitude>
            <range>3500000</range>
            <altitude>1200000</altitude>
            <altitudeMode>relativeToGround</altitudeMode>
            <tilt>3.0</tilt>
        </LookAt>
            """)

        i = 2
        for j, (day, png) in enumerate(frames[:-1]):
            kml.write("""
<GroundOverlay>
    <name>Sea Ice extent at {begin}</name>
    <TimeSpan>
        <begin>{begin}</begin>
        <end>{end}</end>
    </TimeSpan>
    <Icon>
        <href>images/{png}</href>
    </Icon>
    <LatLonBox>
        <north>90</north>
        <south>0</south>
        <east>180</east>
        <west>-180</west>
    </LatLonBox>
</GroundOverlay>
            """.format(
                begin = day.strftime("%Y-%m-%dT%H:%M:%SZ"),
                end = frames[j+1][0].strftime("%Y-%m-%dT%H:%M:%SZ"),
                png = png
            ))
            i += 3

        kml.write("""
</Document>
</kml>
        """)
        kmz.write('doc.kml')



