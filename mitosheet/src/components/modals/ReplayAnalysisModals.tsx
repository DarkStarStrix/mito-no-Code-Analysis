// Copyright (c) Mito

import React, { Fragment, useState } from 'react';
import MitoAPI from '../../api';
import { DISCORD_INVITE_LINK } from '../../data/documentationLinks';
import { MitoError, UIState } from '../../types';
import DefaultModal from '../DefaultModal';
import TextButton from '../elements/TextButton';
import { ModalEnum } from './modals';

/*
    This modal displays to the user when the analysis that they are 
    replaying does not exist on their computer
*/
export const NonexistantReplayedAnalysisModal = (
    props: {
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI,
        oldAnalysisName: string;
        newAnalysisName: string;
    }): JSX.Element => {

    return (
        <DefaultModal
            header={"analysis_to_replay does not exist"}
            modalType={ModalEnum.Error}
            wide
            viewComponent={
                <Fragment>
                    
                    <div className='text-align-left text-body-1'>
                        We&apos;re unable to replay {props.oldAnalysisName} because you don&apos;t have access to it. This is probably because the analysis was created on a different computer.
                    </div>
                </Fragment>
            }
            buttons={
                <>
                    <TextButton
                        variant='light'
                        width='medium'
                        href={DISCORD_INVITE_LINK}
                        target='_blank'
                    >
                        Get Support
                    </TextButton>
                    <TextButton
                        variant='dark'
                        width='medium'
                        onClick={() => {    
                            window.commands?.execute('overwrite-analysis-to-replay-to-mitosheet-call', {
                                oldAnalysisName: props.oldAnalysisName,
                                newAnalysisName: props.newAnalysisName,
                                mitoAPI: props.mitoAPI
                            });
                            
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })}
                        }
                    >
                        Start New Analysis
                    </TextButton>
                </> 
            }
        />
    )    
};

/*
    This modal displays to the user when the analysis that they are 
    replaying fails to run correctly.
*/
export const InvalidReplayedAnalysisModal = (
    props: {
        error: MitoError | undefined, 
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        mitoAPI: MitoAPI;
        oldAnalysisName: string;
        newAnalysisName: string;
    }): JSX.Element => {
    const [viewTraceback, setViewTraceback] = useState(false);

    if (props.error === undefined) {
        return (<></>)
    }

    return (
        <DefaultModal
            header={"Analysis Could Not Be Replayed"}
            modalType={ModalEnum.Error}
            wide
            viewComponent={
                <Fragment>
                    {props.error.to_fix &&
                        <div className='text-align-left text-body-1' onClick={() => setViewTraceback((viewTraceback) => !viewTraceback)}>
                            There was an error replaying your analysis because of changes in the input data. You can see the previous analysis in the code cell below. {' '}
                            {props.error.traceback && 
                                <span className='text-body-1-link'>
                                    Click to view full traceback.
                                </span>
                            }
                        </div>
                    }
                    {props.error.traceback && viewTraceback &&
                        <div className='flex flex-column text-align-left text-overflow-hidden text-overflow-scroll mt-5px' style={{height: '200px', border: '1px solid var(--mito-purple)', borderRadius: '2px', padding: '5px'}}>
                            <pre>{props.error.traceback}</pre>
                        </div>
                    }
                </Fragment>
            }
            buttons={
                <>
                    <TextButton
                        variant='dark'
                        width='medium'
                        onClick={() => {
                            /**
                             * We also need to actually change the analysis to replay in the code cell, 
                             * so that we know something happened to invalidate this analysis to replay,
                             * and we can write new code
                             */
                            window.commands?.execute('overwrite-analysis-to-replay-to-mitosheet-call', {
                                oldAnalysisName: props.oldAnalysisName,
                                newAnalysisName: props.newAnalysisName,
                                mitoAPI: props.mitoAPI
                            });

                            props.setUIState(prevUIState => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None}
                                }
                            })
                        }}
                    >
                        Start New Analysis
                    </TextButton>
                </> 
            }
        />
    )    
};