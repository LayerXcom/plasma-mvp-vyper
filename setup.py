# -*- coding: utf-8 -*-

from setuptools import setup, find_packages


with open('README.md') as f:
    readme = f.read()

setup(
    name='plasma-mvp-vyper',
    description='Plasma MVP Vyper',
    long_description=readme,
    author='Ryuya Nakamura',
    author_email='',
    license=license,
    packages=find_packages(exclude=('tests')),
    include_package_data=True,
    install_requires=[
        'ethereum==2.3.0',
        'web3==4.3.0',
        'werkzeug==0.13',
        'json-rpc==1.10.8',
        'plyvel==1.0.4',
        'py-solc',
        'click==6.7',
        'pytest',
        'flake8==3.5.0',
        'rlp==0.6.0'
    ]
    # entry_points={
    #     'console_scripts': ["omg=plasma.cli:cli"],
    # }
)
