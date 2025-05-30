#!/bin/bash

sqlite3 -header -column database.db "SELECT * FROM time_entries;"
