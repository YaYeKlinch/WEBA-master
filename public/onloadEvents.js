(function() {

    var image;
    var oldVals;
    $(document).ready(function () {
        var dataTypes;

        $.ajax({
            type: "GET",
            url: "/types/",
            success: [function (data) {
                dataTypes = data;
                forms.init.tableForm(dataTypes, 2);
            }],
            error: function (data) {
                showErrorMessage(data);
            }
        });

        forms.hide(".createDatabaseFormSection");
        forms.hide(".createTableFormSection");
        forms.hide(".createRowFormSection");
        forms.hide(".renameColFormSection");

        actions.load.databases();

        //
        // Events

        $(".createDatabaseForm .submitButton").on("click", function () {
            actions.create.database($(".databaseName").val());
        });

        $(".createTableForm .submitButton").on("click", function () {
            actions.create.table($(".databaseList tr.selected > td").text(), dataTypes)
        });

        $(".createRowFormSection .submitButton").on("click", function () {
            actions.create.row(image);
        });

        $(".renameColFormSection .submitButton").on("click", function () {
            actions.create.column();
        });

        $(".cancelButton").on("click", function () {
            forms.hide("." + this.parentNode.parentNode.className);
        });

        $("input[type=file]").on("change", function(){
            actions.load.image(this.files);
        });

        //
        // Buttons

        $("#btnCreateDatabase").on("click", function () {
            forms.show(".createDatabaseFormSection");
        });

        $("#btnDeleteDatabase").on("click", function () {
            actions.delete.database();
        });

        $("#btnDeleteTable").on("click", function () {
            actions.delete.table();
        });

        $("#btnCreateTable").on("click", function () {
            if($(".databaseList tr.selected").length === 1) {
                forms.show(".createTableFormSection");
            }
        });

        $(".addColumn").on("click", function () {
            forms.addFields.tableForm(dataTypes, 1);
        });

        $("#btnCreateRow").on("click", function () {
            if($(".tableList tr.selected").length === 1) {
                forms.show(".createRowFormSection");
            }
        });

        $("#btnRenameCol").on("click", function () {
            if($(".tableList tr.selected").length === 1) {
                forms.show(".renameColFormSection");
            }
        });

    });

    var actions = {
        create: {
            database: function (dbName) {
                $.ajax({
                    type: "POST",
                    url: "/databases/",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify({ databaseName: dbName }),
                    processData: false,
                    success: function () {
                        forms.hide(".createDatabaseFormSection");
                        forms.cleanList(".databaseList");
                        actions.load.databases();
                    },
                    error: function (data) {
                        showErrorMessage(data);
                    }
                })
            },

            table: function (dbName, dataTypes) {
                $.ajax({
                    type: "POST",
                    url: "/databases/" + dbName + "/tables/",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(_parseDataFromForm()),
                    processData: false,
                    success: function () {
                        forms.hide(".createTableFormSection");
                        forms.cleanList(".tableList");
                        actions.load.tables(dbName);
                    },
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });

                function _parseDataFromForm() {
                    var namesFromForm = $(".createTableForm .columnName").filter(function() {
                        return $(this).val() !== "";
                    });
                    var typeFromForm = $(".createTableForm .columnType");

                    var columnNames = new Array(namesFromForm.length);
                    var columnTypes = new Array(namesFromForm.length);

                    for (var i = 0; i < namesFromForm.length; i++) {
                        columnNames[i] = namesFromForm.eq(i).val() + "";
                    }

                    for (var j = 0; j < typeFromForm.length; j++) {
                        if (namesFromForm.eq(j).val() !== undefined) {
                            columnTypes[j] = dataTypes[typeFromForm.eq(j).val()];
                        }
                    }
                    console.log(columnTypes);

                    return {
                        tableName: $(".tableName").val(),
                        columnNames: columnNames,
                        columnTypes: columnTypes,
                        realIntervalConstraint: {
                            minValue: parseInt($(".constraintMin").val()),
                            maxValue: parseInt($(".constraintMax").val())
                        }
                    };
                }
            },

            row: function (image) {
                var outputJson = {};

                outputJson.image = image !== undefined ? image : "";
                outputJson.values = _parseDataFromForm();

                var dbName = $(".databaseList").find("tr.selected").text();
                var tableName = $(".tableList").find("tr.selected").text();

                $.ajax({
                    type: "POST",
                    url: "/databases/" + dbName + "/tables/" + tableName + "/rows/",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(outputJson),
                    processData: false,
                    success: function () {
                        forms.hide(".createRowFormSection");
                        forms.hide(".renameColFormSection");
                        forms.cleanList(".entriesList");

                        actions.load.rows(dbName, tableName);
                    },
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });

                function _parseDataFromForm() {
                    var fieldsFromForm = $(".createRowFormSection .columnValueField");
                    var values = new Array(fieldsFromForm.length);
                    for (var i = 0; i < fieldsFromForm.length; i++) {
                        values[i] = fieldsFromForm.eq(i).val();
                    }
                    return values;
                }
            },
            column() {
                var dbName = $(".databaseList").find("tr.selected").text();
                var tableName = $(".tableList").find("tr.selected").text();
                var oldvals;
                $.ajax({
                    type: "PUT",
                    url: "/databases/" + dbName + "/tables/" + tableName + "/",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(_parseData()),
                    processData: false,
                    success: function () {
                        forms.hide(".createRowFormSection");
                        forms.hide(".renameColFormSection");
                        forms.cleanList(".entriesList");
                        forms.cleanList(".tableList");

                        actions.load.tables(dbName);
                    },
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });

                function _parseData() {
                    var namesFromForm = $(".renameColFormSection .newval");

                    var typeFromForm = $(".renameColFormSection .oldval");

                    var newcolumnNames = new Array(typeFromForm.length);
                    var oldcolumnNames = new Array(typeFromForm.length);
                    var temp = new Array(typeFromForm.length);
                    for (var i = 0; i < oldVals.length; i++) {
                        temp[i] = oldVals[i];
                    }

                    for (var i = 0; i < namesFromForm.length; i++) {
                        newcolumnNames[i] = namesFromForm.eq(i).val() + "";
                    }
                    for (var j = 0; j < typeFromForm.length; j++) {
                        if (typeFromForm.eq(j).val() !== undefined) {
                            oldcolumnNames[j] = oldVals[typeFromForm.eq(j).val()];
                        }
                    }

                    var index = temp.indexOf(oldcolumnNames[0]);
                    if (index !== -1) {
                        temp[index] = newcolumnNames[0];
                    }
                    console.log(oldVals);
                    console.log(temp);
                    console.log(newcolumnNames);
                    console.log(oldcolumnNames);
                    return {
                        columnNames: temp,
                    };
                }
            }
        },

        delete: {
            database: function () {
                var dbName = $(".databaseList").find("tr.selected > td").text();
                $.ajax({
                    type: "DELETE",
                    url: "/databases/" + dbName,
                    success: function () {
                        forms.cleanList(".databaseList");
                        forms.cleanList(".tableList");
                        forms.cleanList(".entriesList");

                        actions.load.databases();
                    },
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });
            },

            table: function () {
                var dbName = $(".databaseList").find("tr.selected > td").text();
                var tableName = $(".tableList").find("tr.selected > td").text();
                $.ajax({
                    type: "DELETE",
                    url: "/databases/" + dbName + "/tables/" + tableName + "/unique",
                    success: function () {


                        actions.load.rows(dbName,tableName, 0);
//                        actions.load.table(tableName);
                    },
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });
            },

            row: function () { }
        },

        load: {
            databases: function () {
                $.ajax({
                    type: "GET",
                    url: "/databases/",
                    success: [function (data) {
                        for (var i = 0; i < data.length; i++) {
                            var row = $("<tr></tr>");
                            $("<td>" + data[i] + "</td>").appendTo(row).on("click", function () {
                                _actionOnClick(this.innerHTML)
                            });
                            row.appendTo(".databaseList" + " > tbody");
                        }
                    }],
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });

                function _actionOnClick(dbName) {
                    forms.hide(".createTableFormSection");
                    forms.hide(".createRowFormSection");
                    forms.hide(".renameColFormSection");

                    $(".databaseList tr.selected").removeClass("selected");
                    $(".databaseList td:contains(" + dbName + ")").filter(function() {
                        return $(this).text() === dbName;
                    }).parent().addClass("selected");

                    forms.cleanList(".tableList");
                    forms.cleanList(".entriesList");

                    actions.load.tables(dbName);
                }
            },

            tables: function (dbName) {

                $.ajax({
                    type: "GET",
                    url: "/databases/" + dbName + "/tables/",
                    success: [function (data) {
                        for (var i = 0; i < data.length; i++) {
                            var row = $("<tr></tr>");
                            $("<td>" + data[i] + "</td>").appendTo(row).on("click", function () {
                                _actionOnClick(dbName, this.innerHTML)
                            });
                            row.appendTo(".tableList" + " > tbody");
                        }
                    }],
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });

                function _actionOnClick(dbName, tableName) {
                    forms.hide(".createRowFormSection");
                    forms.hide(".renameColFormSection");


                    $.ajax({
                        type: "GET",
                        url: "/databases/" + dbName + "/tables/" + tableName + "/",
                        success: [function (data) {
                            $(".tableList tr.selected").removeClass("selected");
                            $(".tableList td:contains(" + tableName + ")").filter(function() {
                                return $(this).text() === tableName;
                            }).parent().addClass("selected");

                            forms.cleanList(".entriesList");

                            actions.load.rows(dbName, tableName);

                            var names = data.columnNames;
                            forms.init.rowForm(names);
                            forms.init.colForm(names);
                        }],
                        error: function (data) {
                            showErrorMessage(data);
                        }
                    })
                }
            },

            rows: function (dbName, tableName, sortByColumnNumber) {
                $.ajax({
                    type: "GET",
                    url: "/databases/" + dbName + "/tables/" + tableName + "/rows/",
                    success: [function (data) {

                        if (data.length > 0 && data[0].values !== undefined) {
                            $(".entriesList").find("th").attr("colspan", data[0].values.length);

                            if (sortByColumnNumber !== undefined) {
                                data.sort(function (a, b) {
                                    return a.values[sortByColumnNumber] > b.values[sortByColumnNumber];
                                });
                            }

                            var rows = _buildRows(data);
                            var sortButtons = _buildSortButtons(data[0].values.length);
                            var table = $(".entriesList > tbody");

                            forms.cleanList(".entriesList");

                            _resizeHeader(data[0].values.length);
                            table.append(rows);
                            table.append(sortButtons);
                        }
                    }],
                    error: function (data) {
                        showErrorMessage(data);
                    }
                });

                function _resizeHeader(size) {
                    $(".entriesList").find("th").attr("colspan", size);
                }

                function _buildRows(data) {
                    var rows = [data.length];
                    for (var k = 0; k < data.length; k++) {
                        var values = data[k].values;
                        var row = $("<tr></tr>");
                        for (var j = 0; j < values.length; j++){
                            $("<td>" + values[j] + "</td>").appendTo(row).on("click", function () {
                                $(".entriesList").find("tr.selected").removeClass("selected");
                                $(this).parent().addClass("selected");

                                var k = $(this).parent('tr').index();
                                $(".image").attr("src", "data:image/png;base64," + data[k-1].image);
                            });
                        }
                        rows[k] = (row);
                    }
                    return rows;
                }

                function _buildSortButtons(columnsAmount) {
                    var sortButtons = $("<tr></tr>");
                    for (var colNumber = 0; colNumber < columnsAmount; colNumber++){
                        var td = $("<td></td>");
                        const num = colNumber;
                        td.on("click", function() {
                            actions.load.rows(dbName, tableName, num);
                        });
                        td.append("<input type='button' class='' value='sort'>");
                        sortButtons.append(td);
                    }
                    return sortButtons;
                }
            },

            image: function (images) {
                $.each(images, function(key, value) {
                    var reader = new FileReader();
                    reader.readAsDataURL(value);
                    reader.onload = function () {
                        if($(".createRowFormSection .textOk").length === 0) {
                            var textOk = $("<span class='textOk'>ok<br></span>");
                            textOk.css("color", "green");
                            $("input[type=file]").after(textOk);
                        }
                        image = reader.result.split(",")[1];
                    };
                });
            }
        }
    };

    var forms = {
        show: function (selector) {
            $(selector).css("display", "block");
        },

        hide: function (selector) {
            $(selector).css("display", "none");
        },

        cleanList: function (selector) {
            $(selector).find("tbody > tr:gt(0)").remove();
            forms.cleanImage();
        },

        cleanImage: function () {
            $(".image").removeAttr("src");
        },
        init: {
            tableForm: function (dataTypes, columnAmount) {
                forms.addFields.tableForm(dataTypes, columnAmount);
            },

            rowForm: function (columnNames) {
                $(".createRowFormSection .fields").html("");
                forms.addFields.rowForm(columnNames);
            },

            colForm: function (columnNames) {
                $(".renameColFormSection .columns").html("");
                forms.addFields.colForm(columnNames);
            }
        },

        addFields: {
            tableForm: function (dataTypes, columnAmount) {
                for (var i = 0; i < columnAmount; i++) {
                    var columnTypeField = $("<select title='type' class='columnType form-control'>" +
                        "</select><br>");
                    for (var typeNumber = 0; typeNumber < dataTypes.length; typeNumber++) {
                        $("<option value=" + typeNumber + ">" + dataTypes[typeNumber] + "</option>")
                            .appendTo(columnTypeField);
                    }
                    var columnNameField = $("<input type='text' class='columnName  form-control' " +
                        "title='column name' placeholder='Column name'>");
                    var columnProps = $("<div></div>");
                    columnProps.append(columnNameField);
                    columnProps.append(columnTypeField);
                    $(".addColumn").before(columnProps);
                }
            },

            rowForm: function (columnNames) {
                for (var i = 0; i < columnNames.length; i++) {
                    var columnNameField = $("<b class='columnNameField'></b>");
                    columnNameField.text(columnNames[i] + ": ");
                    var columnValueField = $("<input type='text' class='columnValueField form-control' " +
                        "title='value field'>");
                    var fieldPair = $("<div class='rowField'></div>");
                    fieldPair.append(columnNameField, columnValueField);
                    $(".createRowFormSection .fields").append(fieldPair);
                }
            },

            colForm: function (columnNames) {
                /*var columnName = $("<b class='oldval'></b>");
                columnName.text(columnNames[i]);*/
                var columnName = $("<select title='type' class='oldval form-control'>" +
                    "</select><br>");
                oldVals = columnNames;
                for (var typeNumber = 0; typeNumber < columnNames.length; typeNumber++) {
                    $("<option value=" + typeNumber + ">" + columnNames[typeNumber] + "</option>")
                        .appendTo(columnName);
                }
                var columnValue = $("<input type='text' class='newval form-control' " +
                    "title='value field'>");
                var fieldPair = $("<div class='colField'></div>");
                fieldPair.append(columnName, columnValue);
                $(".renameColFormSection .columns").append(fieldPair);
                console.log(oldVals);
            }
        }
    };

    function showErrorMessage(response) {
        alert(JSON.parse(response.responseText).message.split(":")[1]);
    }
})();