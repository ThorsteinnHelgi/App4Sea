#! /usr/bin/env python

from datetime import date, timedelta
from zipfile import ZipFile
from urllib.error import HTTPError
from urllib.request import urlopen
from io import BytesIO
from tqdm import tqdm
import numpy as np

url = 'http://masie_web.apps.nsidc.org/pub/DATASETS/NOAA/G02186/kmz/4km/'

start = date(2006, 1, 1)
# end = date(2006, 5, 1)
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
            zname = '%s' % png
            jpg = 'masie_ice_%d%03d.jpg' % (day.timetuple().tm_year, day.timetuple().tm_yday)

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
                                    from PIL import Image
                                    im = Image.open(png_fd).convert('RGBA')
                                    (x, y) = im.size

                                    d = np.array(im)

                                    if len(d.shape) > 2:
                                        ice = [0xF1, 0xF2, 0xF2, 0xff]
                                        v = d[:,:,:4][d[:,:,0] == 254]
                                        v[:,:] = np.tile(ice, (v.shape[0], 1))
                                        d[:,:,:4][d[:,:,0] == 254] = v

                                        im = Image.fromarray(d)
                                    else:
                                        print("weird im:", d.shape)

                                    (x2, y2) = (x//4, y//4)
                                    rim = im.resize((x2, y2), Image.NEAREST)

                                    resized_png = BytesIO()
                                    rim.save(resized_png, format = 'png', optimize = True, compress_level = 9, dpi = (75, 75), quality = 20)

                                    kmz.writestr(png, resized_png.getvalue())
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
            kml.write("""<GroundOverlay>
    <name>Sea Ice extent at {begin}</name>
    <TimeSpan>
        <begin>{begin}</begin>
        <end>{end}</end>
    </TimeSpan>
    <Icon>
        <href>{png}</href>
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

        kml.write("""</Document>
</kml>""")
    kmz.write('doc.kml')



