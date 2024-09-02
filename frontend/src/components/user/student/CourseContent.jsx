import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Accordion, Modal, Button } from 'react-bootstrap';
import axiosInstance from '../../common/AxiosInstance';
import ReactPlayer from 'react-player';
import { UserContext } from '../../../App';
import NavBar from '../../common/NavBar';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const CourseContent = () => {
   const user = useContext(UserContext);
   const { courseId, courseTitle } = useParams();
   const [courseContent, setCourseContent] = useState([]);
   const [currentVideo, setCurrentVideo] = useState(null);
   const [playingSectionIndex, setPlayingSectionIndex] = useState(-1);
   const [completedSections, setCompletedSections] = useState([]);
   const [completedModule, setCompletedModule] = useState([]);
   const [showModal, setShowModal] = useState(false);
   const [certificate, setCertificate] = useState(null);
   const [videoProgress, setVideoProgress] = useState({});

   // Extract sectionIds from completedModule
   const completedModuleIds = completedModule.map((item) => item.sectionId);

   const downloadPdfDocument = (rootElementId) => {
      const input = document.getElementById(rootElementId);
      html2canvas(input).then((canvas) => {
         const imgData = canvas.toDataURL('image/png');
         const pdf = new jsPDF();
         pdf.addImage(imgData, 'JPEG', 0, 0);
         pdf.save('download-certificate.pdf');
      });
   };

   const getCourseContent = async () => {
      try {
         const res = await axiosInstance.get(`/api/user/coursecontent/${courseId}`, {
            headers: {
               "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
         });
         if (res.data.success) {
            setCourseContent(res.data.courseContent);
            setCompletedModule(res.data.completeModule);
            setCertificate(res.data.certficateData.updatedAt);
         }
      } catch (error) {
         console.log(error);
      }
   };

   useEffect(() => {
      getCourseContent();
   }, [courseId]);

   const playVideo = (videoPath, index) => {
      setCurrentVideo(videoPath);
      setPlayingSectionIndex(index);
   };

   const completeModule = async (sectionId) => {
      // Mark the current section as completed
      if (playingSectionIndex !== -1 && !completedSections.includes(playingSectionIndex)) {
         setCompletedSections([...completedSections, playingSectionIndex]);

         // Send a request to the server to update the user's progress
         try {
            const res = await axiosInstance.post(`api/user/completemodule`, {
               courseId,
               sectionId: sectionId
            }, {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
               }
            });
            if (res.data.success) {
               // Handle success if needed
               alert(res.data.message);
               getCourseContent();
            }
         } catch (error) {
            console.log(error);
         }
      }
   };

   const isSectionCompleted = (index) => {
      const section = courseContent[index];
      const videosCount = Array.isArray(section.S_content) ? section.S_content.length : (section.S_content ? 1 : 0);
      const completedVideosCount = videoProgress[index] ? Object.values(videoProgress[index]).filter(Boolean).length : 0;
      return videosCount === completedVideosCount;
   };

   const allModulesCompleted = () => {
      return courseContent.length > 0 && completedSections.length === courseContent.length;
   };

   const handleVideoProgress = (sectionIndex, videoIndex, played) => {
      setVideoProgress(prevState => {
         const newProgress = { ...prevState };
         if (!newProgress[sectionIndex]) {
            newProgress[sectionIndex] = {};
         }
         newProgress[sectionIndex][videoIndex] = played >= 0.95; // Mark as watched if played 95% or more
         return newProgress;
      });
   };

   return (
      <>
         <NavBar />
         <h1 className='my-3 text-center'>Welcome to the course: {courseTitle}</h1>

         <div className='course-content'>
            <div className="course-section">
               <Accordion defaultActiveKey="0" flush>
                  {courseContent.map((section, index) => {
                     const sectionId = index;

                     return (
                        <Accordion.Item key={index} eventKey={index.toString()}>
                           <Accordion.Header>{section.S_title}</Accordion.Header>
                           <Accordion.Body>
                              {section.S_description}
                              {Array.isArray(section.S_content) && section.S_content.length > 0 ? (
                                 <>
                                    {section.S_content.map((video, i) => (
                                       <Button key={i} onClick={() => playVideo(`http://localhost:8000${video.path}`, index)}>
                                          Play Video {i + 1}
                                       </Button>
                                    ))}
                                 </>
                              ) : (
                                 <>
                                    {section.S_content && ( // Render if S_content is truthy
                                       <Button onClick={() => playVideo(`http://localhost:8000${section.S_content.path}`, index)}>
                                          Play Video
                                       </Button>
                                    )}
                                 </>
                              )}
                              {isSectionCompleted(index) && (
                                 <Button
                                    variant='success'
                                    size='sm'
                                    onClick={() => completeModule(sectionId)}
                                    disabled={playingSectionIndex !== index}
                                 >
                                    Completed
                                 </Button>
                              )}
                           </Accordion.Body>
                        </Accordion.Item>
                     );
                  })}
                  {allModulesCompleted() && (
                     <Button className='my-2' onClick={() => setShowModal(true)}>Download Certificate</Button>
                  )}
               </Accordion>
            </div>
            <div className="course-video w-50">
               {currentVideo && (
                  <ReactPlayer
                     url={currentVideo}
                     width='100%'
                     height='100%'
                     controls
                     onProgress={({ played }) => handleVideoProgress(playingSectionIndex, currentVideo, played)}
                  />
               )}
            </div>
         </div>
         <Modal
            size="lg"
            show={showModal}
            onHide={() => setShowModal(false)}
            dialogClassName="modal-90w"
            aria-labelledby="example-custom-modal-styling-title"
         >
            <Modal.Header closeButton>
               <Modal.Title>Completion Certificate</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               Congratulations! You have completed all sections. Here is your certificate
               <div id='certificate-download' className="certificate text-center" style={{
                  backgroundImage: "url('https://st.depositphotos.com/1766900/2241/v/450/depositphotos_22417647-stock-illustration-editable-vector-certificate-template-with.jpg')",
                  backgroundSize: "cover", 
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  height:"60vh",
                  width:"40vw"
               }}>
                  <br />
                  <h1 style={{color:"red"}}>Certificate of Completion</h1>
                  <div className="content">
                     <p>This is to certify that</p>
                     <h2><b>{user.userData.name}</b></h2>
                     <p>has successfully completed all requirements of the course</p>
                     <h3 style={{color:"blue"}}>{courseTitle}</h3>
                     <p>on</p>
                     <p className="date">{certificate ? new Date(certificate).toLocaleDateString() : ''}</p>
                  </div>
               </div>
               <Button onClick={() => downloadPdfDocument('certificate-download')} style={{ float: 'right', marginTop: 3 }}>Download Certificate</Button>
            </Modal.Body>
         </Modal>
      </>
   );
};

export default CourseContent;
