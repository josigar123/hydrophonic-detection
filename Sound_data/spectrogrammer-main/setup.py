from setuptools import find_packages, setup

with open("README.md", "r") as f:
    long_description = f.read()

setup(
    name="spectrogrammer",
    version="1.0.1",
    description="a spectrogram generator and plotter for wav files",
    packages=find_packages(),
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Navodplayer1/spectrogrammer",
    author="Navod Peiris",
    author_email="navodpeiris1234@gmail.com",
    license="MIT",
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.10",
        "Operating System :: OS Independent",
    ],
    install_requires=["tensorflow", "numpy", "matplotlib", "soundfile"],
    python_requires=">=3.7",
)