import React from 'react';
import '../../../../css/endo/CellEditor.css';
import { FunctionDocumentationObject } from '../../../data/function_documentation';
import { EditorState, SheetData } from '../../../types';
import { classNames } from '../../../utils/classNames';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import LoadingDots from '../../elements/LoadingDots';
import Toggle from '../../elements/Toggle';
import Row from '../../layout/Row';
import { getCellDataFromCellIndexes } from '../utils';
import { getCellEditorWidth, getDocumentationFunction, getFormulaEndsInReference, getFullFormula, getSuggestedColumnHeaders, getSuggestedFunctions } from './cellEditorUtils';

export const MAX_SUGGESTIONS = 4;

type SuggestionDisplayDropdownType = {
    'type': 'suggestions',
    'suggestedColumnHeaders': [string, string][],
    'suggestedColumnHeadersReplacementLength': number,
    'suggestedFunctions': [string, string][],
    'suggestedFunctionsReplacementLength': number,
}

type DisplayedDropdownType = {
    'type': 'error',
    'error': string,
} | {
    'type': 'loading',
} | SuggestionDisplayDropdownType 
| {
    'type': 'documentation',
    'documentationFunction': FunctionDocumentationObject,
}


export const getDisplayedDropdownType = (
    sheetData: SheetData,
    editorState: EditorState,
    selectionStart: number | null | undefined,
    cellEditorError: string | undefined,
    loading: boolean,
): DisplayedDropdownType | undefined => {

    const fullFormula = getFullFormula(editorState.formula, editorState.pendingSelections, sheetData);
    const endsInReference = getFormulaEndsInReference(fullFormula, sheetData);

    console.log("ENDS IN REFERNECE")

    // NOTE: we get our suggestions off the non-full formula, as we don't want to make suggestions
    // for column headers that are pending currently
    const [suggestedColumnHeadersReplacementLength, suggestedColumnHeaders] = getSuggestedColumnHeaders(editorState.formula, sheetData);
    const [suggestedFunctionsReplacementLength, suggestedFunctions] = getSuggestedFunctions(editorState.formula, suggestedColumnHeadersReplacementLength);

    const documentationFunction = getDocumentationFunction(fullFormula, selectionStart);

    if (cellEditorError !== undefined) {
        return {
            'type': 'error',
            'error': cellEditorError,
        };
    } else if (loading) {
        return {
            'type': 'loading',
        };
    } else if (!endsInReference && (suggestedColumnHeaders.length > 0 || suggestedFunctions.length > 0)) {
        return {
            'type': 'suggestions',
            'suggestedColumnHeaders': suggestedColumnHeaders,
            'suggestedColumnHeadersReplacementLength': suggestedColumnHeadersReplacementLength,
            'suggestedFunctions': suggestedFunctions,
            'suggestedFunctionsReplacementLength': suggestedFunctionsReplacementLength,
        };
    } else if (documentationFunction !== undefined && editorState.pendingSelections === undefined) {
        return {
            'type': 'documentation',
            'documentationFunction': documentationFunction,
        };
    }

    return undefined;
}

const CellEditorDropdown = (props: {
    sheetData: SheetData,
    sheetIndex: number,
    editorState: EditorState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    cellEditorInputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>
    selectedSuggestionIndex: number;
    setSavedSelectedSuggestionIndex: React.Dispatch<React.SetStateAction<number>>,
    displayedDropdownType: DisplayedDropdownType | undefined
}): JSX.Element => {

    const {columnID, columnHeader, indexLabel} = getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);

    if (columnID === undefined || columnHeader === undefined || indexLabel === undefined) {
        return <></>;
    }

    const displayedDropdownType = props.displayedDropdownType;

    const formula = getFullFormula(props.editorState.formula, props.editorState.pendingSelections, props.sheetData)
    const cellEditorWidth = getCellEditorWidth(formula, props.editorState.editorLocation);

    return (
        <div className='cell-editor-dropdown-box' style={{width: `${cellEditorWidth}px`}}>
            {displayedDropdownType?.type !== 'error' && props.editorState.rowIndex != -1 &&
                <Row justify='space-between' align='center' className='cell-editor-label'>
                    <p className={classNames('text-subtext-1', 'pl-5px', 'mt-2px')} title={props.editorState.editingMode === 'entire_column' ? 'You are currently editing the entire column. Setting a formula will change all values in the column.' : 'You are currently editing a specific cell. Changing this value will only effect this cell.'}>
                        Edit entire column
                    </p>
                    <Toggle
                        className='mr-5px'
                        value={props.editorState.editingMode === 'entire_column' ? true : false}
                        onChange={() => {
                            props.setEditorState(prevEditorState => {
                                if (prevEditorState === undefined) {
                                    return undefined
                                }
                                const prevEditingMode = {...prevEditorState}.editingMode
                                return {
                                    ...prevEditorState,
                                    editingMode: prevEditingMode === 'entire_column' ? 'specific_index_labels' : 'entire_column'
                                }
                            })
                        }}
                        height='20px'
                    />
                </Row>
            }
            {displayedDropdownType?.type !== 'error' && props.editorState.rowIndex == -1 &&
                <p className={classNames('text-subtext-1', 'pl-5px', 'mt-2px')} title='You are currently editing the column header.'>
                    Edit column header
                </p>
            }
            {/* Show an error if there is currently an error */}
            {displayedDropdownType?.type === 'error' &&
                <div className='cell-editor-error-container pl-10px pr-5px pt-5px pb-5px'>
                    <p className='text-body-1 text-color-error'>
                        {displayedDropdownType.error}
                    </p>
                    <p className='text-subtext-1'>
                        Press Escape to close the cell editor.
                    </p>
                </div>
            }
            {/* Show we're loading if we're currently loading */}
            {displayedDropdownType?.type === 'loading' && 
                <p className='text-body-2 pl-5px'>
                    Processing<LoadingDots />
                </p>
            }
            {/* Show the suggestions */}
            {displayedDropdownType?.type === 'suggestions' &&
                <>
                    {(displayedDropdownType.suggestedColumnHeaders.concat(displayedDropdownType.suggestedFunctions)).map(([suggestion, subtext], idx) => {
                        // We only show at most 4 suggestions
                        if (idx > MAX_SUGGESTIONS) {
                            return <></>
                        }

                        const selected = idx === props.selectedSuggestionIndex;
                        const suggestionClassNames = classNames('cell-editor-suggestion', 'text-body-2', {
                            'cell-editor-suggestion-selected': selected
                        });
                        
                        return (
                            <div 
                                onMouseEnter={() => props.setSavedSelectedSuggestionIndex(idx)}
                                onClick={() => {
                                    // Take a suggestion if you click on it
                                    
                                    let suggestionReplacementLength = 0;
                                    let suggestion = '';

                                    let isColumnHeaderSuggestion = true;
                                    if (idx < displayedDropdownType.suggestedColumnHeaders.length) {
                                        suggestionReplacementLength = displayedDropdownType.suggestedColumnHeadersReplacementLength
                                        suggestion = displayedDropdownType.suggestedColumnHeaders[idx][0];
                                    } else {
                                        suggestionReplacementLength = displayedDropdownType.suggestedFunctionsReplacementLength
                                        // We add a open parentheses onto the formula suggestion
                                        suggestion = displayedDropdownType.suggestedFunctions[idx - displayedDropdownType.suggestedColumnHeaders.length][0] + '(';
                                        isColumnHeaderSuggestion = false;
                                    }

                                    // Get the full formula
                                    let fullFormula = getFullFormula(
                                        props.editorState.formula, 
                                        props.editorState.pendingSelections, 
                                        props.sheetData,
                                    );

                                    // Strip the prefix, and append the suggestion, and the current index label as well
                                    fullFormula = fullFormula.substr(0, fullFormula.length - suggestionReplacementLength);
                                    fullFormula += suggestion;
                                    if (isColumnHeaderSuggestion) {
                                        fullFormula += getDisplayColumnHeader(indexLabel);
                                    }

                                    // Update the cell editor state
                                    props.setEditorState({
                                        ...props.editorState,
                                        formula: fullFormula,
                                        pendingSelections: undefined,
                                        arrowKeysScrollInFormula: props.editorState.editorLocation === 'formula bar' ? true : false
                                    })

                                    // Make sure we jump to the end of the input, as we took the suggestion
                                    props.cellEditorInputRef.current?.setSelectionRange(
                                        fullFormula.length, fullFormula.length
                                    )
                                    // Make sure we're focused
                                    props.cellEditorInputRef.current?.focus();
                                }}
                                className={suggestionClassNames} 
                                key={suggestion}
                            >
                                <span className='text-overflow-hide' title={suggestion}>
                                    {suggestion}
                                </span>
                                {selected &&
                                    <div className={classNames('cell-editor-suggestion-subtext', 'text-subtext-1')}>
                                        {subtext}
                                    </div>
                                }
                            </div>
                        )
                    })}
                </>
            }
            {/* Otherwise, display the documentation function */}
            {displayedDropdownType?.type === 'documentation' &&
                <div>
                    <div className='cell-editor-function-documentation-header pt-5px pb-10px pl-10px pr-10px'>
                        <p className='text-body-2'>
                            {displayedDropdownType.documentationFunction.syntax}
                        </p>
                        <p className='text-subtext-1'>
                            {displayedDropdownType.documentationFunction.description}
                        </p>
                    </div>
                    <div className='pt-5px pb-10px pr-10px pl-10px'>
                        <p className='text-subtext-1'>
                            Examples
                        </p>
                        {displayedDropdownType.documentationFunction.examples?.map((example, index) => {
                            return (
                                <p 
                                    key={index}
                                    className='cell-editor-function-documentation-example'
                                >
                                    {example}
                                </p>
                            )
                        })}
                    </div>
                </div>
            }
        </div>
    )
}

export default CellEditorDropdown;