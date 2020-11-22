package webdbms.controller;

import org.springframework.web.bind.annotation.*;
import webdbms.DBMS.database.Database;
import webdbms.DBMS.datatype.DataType;
import webdbms.DBMS.datatype.constraint.RealConstraint;
import webdbms.DBMS.entry.Entry;
import webdbms.DBMS.exception.StorageException;
import webdbms.DBMS.table.Table;
import webdbms.DBMS.table.TableFactory;
import webdbms.facades.DatabaseFacade;
import webdbms.facades.EntryFacade;
import webdbms.facades.TableFacade;
import webdbms.service.DatabaseService;
import webdbms.service.TableService;
import webdbms.service.exception.InternalServerException;
import webdbms.service.exception.InvalidRequestBodyException;

import java.util.*;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/databases/{databaseName}/tables")
public class TableController {

    private DatabaseService databaseService;
    private TableService tableService;

    @RequestMapping(value = "/", method = RequestMethod.GET)
    public Collection<String> getAllTables(@PathVariable String databaseName) {
        try {
            return new DatabaseFacade(databaseService.findByName(databaseName))
                    .getTableNames();
        } catch (StorageException e) {
            throw new InternalServerException(e);
        }
    }

    @RequestMapping(value = "/{tableName}", method = RequestMethod.GET)
    public TableFacade getTable(@PathVariable String databaseName,
                                @PathVariable String tableName) {
        try {
            Table table = tableService.findByName(databaseName, tableName);
            return new TableFacade(table);
        } catch (StorageException e) {
            throw new InternalServerException(e);
        }
    }

    @SuppressWarnings("unchecked")
    @RequestMapping(value = "/", method = RequestMethod.POST)
    public void createTable(@PathVariable String databaseName,
                            @RequestBody Map<String, Object> requestBody) {
        try {
            String name = requestBody.get("tableName").toString();
            List<DataType> types = getTypesFromObjects((List<Object>) requestBody.get("columnTypes"));
            RealConstraint constraint = getConstraintFromMap((Map) requestBody.get("realIntervalConstraint"));
            List<String> columnNames = getColumnNamesFromObjects((List<Object>) requestBody.get("columnNames"));
            tableService.createTable(databaseName, name, types, columnNames, constraint);
        } catch (ClassCastException | NullPointerException e) {
            throw new InvalidRequestBodyException();
        } catch (StorageException e) {
            throw new InternalServerException(e);
        }
    }


    @RequestMapping(value = "/{tableName}", method = RequestMethod.PUT)
    public void renameColumn(@PathVariable String databaseName,
                             @RequestBody Map<String, Object> requestBody, @PathVariable String tableName) {
        try {
            List<String> columnNames = getColumnNamesFromObjects((List<Object>) requestBody.get("columnNames"));
            //tableService.createTable(databaseName, name, types, columnNames, constraint);
            tableService.findByName(databaseName, tableName).changeColumnName(columnNames);
        } catch (ClassCastException | NullPointerException e) {
            throw new InvalidRequestBodyException();
        } catch (StorageException e) {
            throw new InternalServerException(e);
        }
    }

    @RequestMapping(value = "/{tableName}/unique", method = RequestMethod.DELETE)
    public void deleteSameRows(@PathVariable String databaseName,
                               @PathVariable String tableName) {
        try {
            List<Integer> count = new ArrayList<>();
            List<Entry> entries = tableService.findByName(databaseName, tableName).getEntries();
            for (int i = 0; i < entries.size() - 1; i++) {
                for (int j = i + 1; j < entries.size(); j++) {
                    for (int z = 0; z < entries.get(i).getValues().size(); z++) {
                        if (entries.get(i).getValues().get(z).equals(entries.get(j).getValues().get(z))) {
                            if (z == entries.get(i).getValues().size() - 1) {
                                count.add(j);
                            }

                        } else break;
                    }
                }
            }

//            Map<Integer, Entry> entryMap = new HashMap<>();
//
//            for(int i = 0; i < entries.size(); i++) {
//                entryMap.put(i, entries.get(i));
//            }
//
//            HashMap<Entry, Integer> map = new HashMap<>();
//            Set<Integer> keys = entryMap.keySet(); // The set of keys in the map.
//
//            Iterator<Integer> keyIter = keys.iterator();
//
//            while (keyIter.hasNext()) {
//                Integer key = keyIter.next();
//                Entry value = entryMap.get(key);
//                map.put(value, key);
//            }


            List<Integer> listWithoutDuplicates = new ArrayList<>(
                    new HashSet<>(count));
            listWithoutDuplicates.sort(Integer::compareTo);
            for (int i = listWithoutDuplicates.size() - 1; i >= 0; i--) {
                deleteRow(databaseName, tableName, listWithoutDuplicates.get(i));
            }


        } catch (StorageException e) {
            throw new InternalServerException(e);
        }
    }

    private List<DataType> getTypesFromObjects(List<Object> objects) {
        List<DataType> types = new ArrayList<>();
        objects.forEach(type -> types.add(DataType.valueOf(type.toString())));
        return types;
    }

    private RealConstraint getConstraintFromMap(Map<String, Object> map) {
        if (map.get("maxValue") == null && map.get("minValue") == null) {
            return new RealConstraint();
        }
        double maxValue = map.get("maxValue") instanceof Integer ? (int) map.get("maxValue") : (double) map.get("maxValue");
        double minValue = map.get("minValue") instanceof Integer ? (int) map.get("minValue") : (double) map.get("minValue");
        return new RealConstraint(minValue, maxValue);
    }

    private List<String> getColumnNamesFromObjects(List<Object> objects) {
        List<String> names = new ArrayList<>();
        objects.forEach(colName -> names.add(colName.toString()));
        return names;
    }


    public void setDatabaseService(DatabaseService databaseService) {
        this.databaseService = databaseService;
    }

    public void setTableService(TableService tableService) {
        this.tableService = tableService;
    }

    public void deleteRow(String databaseName, String tableName,
                          int rowNumber) {
        try {
            Database database = databaseService.findByName(databaseName);
            List<Entry> entries = tableService.findByName(databaseName, tableName).getEntries();
            if (!isRowNumberValid(entries.size(), rowNumber)) {
                throw new InvalidRequestBodyException();
            }
            tableService.findByName(databaseName, tableName).deleteRow(rowNumber);
            database.save();
        } catch (StorageException e) {
            throw new InternalServerException(e);
        }
    }

    private boolean isRowNumberValid(int tableSize, int rowNumber) {
        return rowNumber < tableSize && rowNumber >= 0;
    }
}
