from qgis.core import (
    QgsApplication,
    QgsVectorLayer,
    QgsField,
    QgsFeature,
    QgsGeometry,
    QgsPointXY,
    QgsVectorFileWriter,
    QgsCoordinateTransformContext,
    QgsProject
)

from PyQt5.QtCore import QVariant

QgsApplication.setPrefixPath("/usr", True)
qgs = QgsApplication([], True)
qgs.initQgis()

layer = QgsVectorLayer("Point?crs=EPSG:4326", "FirstLayer", "memory")
if not layer.isValid():
    print("Failed to create layer")
    exit()

layer_provider = layer.dataProvider()
layer_provider.addAttributes([
    QgsField("id", QVariant.Int),
    QgsField("name", QVariant.String),
    QgsField("value", QVariant.Double)
])
layer.updateFields()

features = []

points = [
    (1, "Point A", 10.5, QgsPointXY(10.0, 20.0)),
    (2, "Point B", 15.0, QgsPointXY(15.0, 25.0)),
    (3, "Point C", 25.5, QgsPointXY(20.0, 30.0))
]

for point in points:
    feature = QgsFeature()
    feature.setGeometry(QgsGeometry.fromPointXY(point[3]))
    feature.setAttributes([point[0], point[1], point[2]])
    features.append(feature)

layer_provider.addFeatures(features)

for feature in layer.getFeatures():
    print(f"Feature ID: {feature.id()}, Attributes: {feature.attributes()}, Geometry: {feature.geometry().asWkt()}")

output_path = "qgis_layers_test/layer.gpkg"
save_options = QgsVectorFileWriter.SaveVectorOptions()
save_options.driverName = "GPKG"
save_options.crs = layer.crs()
error = QgsVectorFileWriter.writeAsVectorFormatV3(
    layer, output_path, QgsCoordinateTransformContext(), save_options
)

if error == 0:
    print("Saved layer")
else:
    print("Something went wrong")

qgs.exitQgis()
