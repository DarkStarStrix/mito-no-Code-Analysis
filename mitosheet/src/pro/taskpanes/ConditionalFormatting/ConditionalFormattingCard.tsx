import React from 'react';
import { ColumnID, ConditionalFormat, DataframeFormat, FilterType, RecursivePartial, SheetData } from '../../../types';
import '../../../../css/taskpanes/ConditionalFormatting/ConditionalFormattingCard.css'
import { Filter } from '../../../components/taskpanes/ControlPanel/FilterAndSortTab/filter/Filter';
import MultiToggleBox from '../../../components/elements/MultiToggleBox';
import MultiToggleItem from '../../../components/elements/MultiToggleItem';
import { getDisplayColumnHeader, getFirstCharactersOfColumnHeaders } from '../../../utils/columnHeaders';
import { getDtypeValue } from '../../../components/taskpanes/ControlPanel/FilterAndSortTab/DtypeCard';
import { addIfAbsent, removeIfPresent, toggleInArray } from '../../../utils/arrays';
import LabelAndColor from '../../graph/LabelAndColor';
import { ODD_ROW_BACKGROUND_COLOR_DEFAULT, ODD_ROW_TEXT_COLOR_DEFAULT } from '../../../components/endo/GridData';
import { ALL_SELECT_OPTIONS, NUMBER_SELECT_OPTIONS } from '../../../components/taskpanes/ControlPanel/FilterAndSortTab/filter/filterConditions';
import { capitalizeFirstLetter } from '../../../utils/strings';
import ConditionalFormatIcon from '../../../components/icons/ConditionalFormatIcon';
import ConditionalFormatInvalidIcon from '../../../components/icons/ConditionalFormatInvalidIcon';
import ExpandableContentCard from '../../../components/elements/ExpandableContentCard';



interface ConditionalFormattingProps {
    df_format: DataframeFormat,
    conditionalFormat: ConditionalFormat,
    updateDataframeFormatParams: (df_format: RecursivePartial<DataframeFormat>) => void;
    sheetData: SheetData;
    openFormattingCardIndex: number
    setOpenFormattingCardIndex: React.Dispatch<React.SetStateAction<number>>
}

// Gets the message displayed on the closed conditional formatting card about which columns this is applied to.
const getColumnHeadersIncludedMessage = (sheetData: SheetData, columnIDs: ColumnID[]): JSX.Element => {
    if (columnIDs.length === 0) {
        return (<p>Applied to 0 columns.</p>)
    } 

    const columnHeaders = columnIDs.map(columnID => sheetData.columnIDsMap[columnID]).filter(columnHeader => columnHeader !== undefined);
    const [columnHeadersString, numOtherColumnHeaders] = getFirstCharactersOfColumnHeaders(columnHeaders, 15)
    
    if (numOtherColumnHeaders === 0) {
        return (<p>Applied to <span className='text-color-gray-important'>{columnHeadersString}</span>.</p>)
    } else {
        return (<p>Applied to <span className='text-color-gray-important'>{columnHeadersString}</span> and <span className='text-color-gray-important'>{numOtherColumnHeaders}</span> others.</p>)
    }
}

// Gets the message to display if there are invalid columns in this conditional format (e.g. the filter can't be applied)
const getInvalidColumnHeadersMessage = (sheetData: SheetData, invalidColumnIDs: ColumnID[], filters: FilterType[]): JSX.Element | null => {
    if (invalidColumnIDs.length === 0) {
        return null
    } 

    // Sort in the order they appear in the column id map, so they are in the same order
    // as the mutli-toggle box
    const allColumnIDs = Object.keys(sheetData.columnIDsMap);
    const sortedColumnIDs = invalidColumnIDs.sort((a, b) => {
        return allColumnIDs.indexOf(a) - allColumnIDs.indexOf(b);
    })

    const columnHeaders = sortedColumnIDs.map(columnID => sheetData.columnIDsMap[columnID]).filter(columnHeader => columnHeader !== undefined);
    const [columnHeadersString, numOtherColumnHeaders] = getFirstCharactersOfColumnHeaders(columnHeaders, 20)
    
    // We try and give users a good error message. The most common errors are the user are missing a value in their
    // filter, or the types of the filter are incorrect, so we have a simple heuristic to detect which is which
    let likelyCauseOfInvalid = 'This is likely due to incompatible dtypes.'
    if (
        filters.length === 1 && 
        (Object.keys(NUMBER_SELECT_OPTIONS).includes(filters[0].condition) || (filters[0].condition === 'most_frequent' || filters[0].condition === 'least_frequent')) &&
        filters[0].value === ''
    ) {
        likelyCauseOfInvalid = 'Please enter a number in the condition input.'
    }


    if (numOtherColumnHeaders === 0) {
        return (<p>This condition cannot be applied to <span className='text-color-error-important'>{columnHeadersString}</span>. {likelyCauseOfInvalid}</p>)
    } else {
        return (<p>This condition cannot be applied to <span className='text-color-error-important'>{columnHeadersString}</span> and <span className='text-color-error-important'>{numOtherColumnHeaders}</span> others. {likelyCauseOfInvalid}</p>)
    }
}


const ConditionalFormattingCard = (props: ConditionalFormattingProps): JSX.Element => {

    const conditionalFormatIndex = props.df_format.conditional_formats.findIndex(format => {return format.format_uuid === props.conditionalFormat.format_uuid});
    
    const invalidColumnIDs = (props.sheetData.conditionalFormattingResult?.invalid_conditional_formats[props.conditionalFormat.format_uuid] || []);
    const invalidColumnIDMessage = getInvalidColumnHeadersMessage(props.sheetData, invalidColumnIDs, props.conditionalFormat.filters);

    const conditionText = capitalizeFirstLetter((ALL_SELECT_OPTIONS[props.conditionalFormat.filters[0]?.condition]['long_name'] || 'contains'));

    const color = props.conditionalFormat.color || ODD_ROW_TEXT_COLOR_DEFAULT;
    const backgroundColor = props.conditionalFormat.backgroundColor || ODD_ROW_BACKGROUND_COLOR_DEFAULT;

    return (
        <ExpandableContentCard
            title={<>{conditionText} {props.conditionalFormat.filters[0]?.value}</>}
            subtitle={<>{getColumnHeadersIncludedMessage(props.sheetData, props.conditionalFormat.columnIDs)}</>}
            expandedTitle={'Columns to format'}

            isExpanded={props.openFormattingCardIndex === conditionalFormatIndex}
            setExpanded={(newIsExpanded) => {
                if (newIsExpanded) {
                    props.setOpenFormattingCardIndex(conditionalFormatIndex);
                } else {
                    props.setOpenFormattingCardIndex(-1);
                }
            }}

            icon={
                <>
                     {invalidColumnIDs.length === 0 &&
                        <ConditionalFormatIcon
                            color={color}
                            backgroundColor={backgroundColor}
                        />
                    }
                    {invalidColumnIDs.length !== 0 &&
                        <ConditionalFormatInvalidIcon
                            color={color}
                            backgroundColor={backgroundColor}
                        />
                    }
                </>
            }
            iconTitle={invalidColumnIDs.length !== 0 ? `This conditional format cannot be applied to ${invalidColumnIDs.length} column${invalidColumnIDs.length === 1 ? '' : 's'} that ${invalidColumnIDs.length === 1 ? 'is' : 'are'} selected. Please update the filters or selected columns to fix.` : ''}
            
            onDelete={() => {
                const newConditionalFormats = [...props.df_format.conditional_formats];
                newConditionalFormats.splice(conditionalFormatIndex, 1);
                props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
            }}
        
        >
            <MultiToggleBox
                searchable
                toggleAllIndexes={(indexesToToggle, newToggle) => {
                    const columnIDs = Object.keys(props.sheetData?.columnDtypeMap || {})
                        .map((columnID) => {return columnID})
                        .filter((_, index) => {
                            return indexesToToggle.includes(index);
                        });

                    const newSelectedColumnIDs = [...props.conditionalFormat.columnIDs];
                    if (newToggle) {
                        columnIDs.forEach((columnID) => {
                            addIfAbsent(newSelectedColumnIDs, columnID);
                        })
                    } else {
                        columnIDs.forEach((columnID) => {
                            removeIfPresent(newSelectedColumnIDs, columnID);
                        })
                    }
                    const newConditionalFormats = [...props.df_format.conditional_formats];
                    newConditionalFormats[conditionalFormatIndex].columnIDs = newSelectedColumnIDs;

                    props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                }}
                height='medium'
            >
                {Object.entries(props.sheetData?.columnDtypeMap || {}).map(([columnID, columnDtype], index) => {
                    const columnHeader = props.sheetData.columnIDsMap[columnID];
                    const toggled = props.conditionalFormat.columnIDs.includes(columnID);
                    const isInvalid = invalidColumnIDs.includes(columnID); // If it's invalid, we merge
                    return (
                        <MultiToggleItem
                            key={index}
                            title={getDisplayColumnHeader(columnHeader) + (isInvalid ? " (invalid)" : '')}
                            rightText={getDtypeValue(columnDtype)}
                            toggled={toggled}
                            index={index}
                            onToggle={() => {
                                const newSelectedColumnIDs = [...props.conditionalFormat.columnIDs];
                                toggleInArray(newSelectedColumnIDs, columnID);
                                const newConditionalFormats = [...props.df_format.conditional_formats];
                                newConditionalFormats[conditionalFormatIndex].columnIDs = newSelectedColumnIDs;
        
                                props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                            }}
                        />
                    ) 
                })}
            </MultiToggleBox>
            {invalidColumnIDMessage}
            <Filter
                filter={props.conditionalFormat.filters[0]}
                columnDtype={undefined}
                operator={"And"}
                displayOperator={false}
                setFilter={(newFilter) => {
                    const newConditionalFormats = [...props.df_format.conditional_formats];
                    newConditionalFormats[conditionalFormatIndex].filters = [newFilter];
                    props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                }}
                nameLength='long_name'
            />
            <LabelAndColor 
                label="Text Color"
                color={color}
                onChange={(newColor) => {
                    const newConditionalFormats = [...props.df_format.conditional_formats];
                    newConditionalFormats[conditionalFormatIndex].color = newColor;
                    props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                }}              
            />
            <LabelAndColor 
                label="Background Color"
                color={backgroundColor}
                onChange={(newColor) => {
                    const newConditionalFormats = [...props.df_format.conditional_formats];
                    newConditionalFormats[conditionalFormatIndex].backgroundColor = newColor;
                    props.updateDataframeFormatParams({...props.df_format, conditional_formats: newConditionalFormats});
                }}              
            />
        </ExpandableContentCard>
    )
}

export default ConditionalFormattingCard;