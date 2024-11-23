import React from "react";

export const Start = () => {
  const [gameId, setGameId] = React.useState("");
  const [clientId, setClientId] = React.useState("");

  const createGame = async () => {
    const response = await fetch("http://localhost:5173/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // try {
    //   const result = await response.json();
    //   console.log("Success:", result);
    //   setGameId(result.gameId);
    //   setClientId(result.clientId);
    // } catch (error) {
    //   console.error("Error:", error);
    // }
    console.log(response.status);
  };

  /* CSS */
  // .button-29 {
  //   align-items: center;
  //   appearance: none;
  //   background-image: radial-gradient(100% 100% at 100% 0, #5adaff 0, #5468ff 100%);
  //   border: 0;
  //   border-radius: 6px;
  //   box-shadow: rgba(45, 35, 66, .4) 0 2px 4px,rgba(45, 35, 66, .3) 0 7px 13px -3px,rgba(58, 65, 111, .5) 0 -3px 0 inset;
  //   box-sizing: border-box;
  //   color: #fff;
  //   cursor: pointer;
  //   display: inline-flex;
  //   font-family: "JetBrains Mono",monospace;
  //   height: 48px;
  //   justify-content: center;
  //   line-height: 1;
  //   list-style: none;
  //   overflow: hidden;
  //   padding-left: 16px;
  //   padding-right: 16px;
  //   position: relative;
  //   text-align: left;
  //   text-decoration: none;
  //   transition: box-shadow .15s,transform .15s;
  //   user-select: none;
  //   -webkit-user-select: none;
  //   touch-action: manipulation;
  //   white-space: nowrap;
  //   will-change: box-shadow,transform;
  //   font-size: 18px;
  // }
  //
  // .button-29:focus {
  //   box-shadow: #3c4fe0 0 0 0 1.5px inset, rgba(45, 35, 66, .4) 0 2px 4px, rgba(45, 35, 66, .3) 0 7px 13px -3px, #3c4fe0 0 -3px 0 inset;
  // }
  //
  // .button-29:hover {
  //   box-shadow: rgba(45, 35, 66, .4) 0 4px 8px, rgba(45, 35, 66, .3) 0 7px 13px -3px, #3c4fe0 0 -3px 0 inset;
  //   transform: translateY(-2px);
  // }
  //
  // .button-29:active {
  //   box-shadow: #3c4fe0 0 3px 7px inset;
  //   transform: translateY(2px);
  // }

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          margin: "auto",
          width: "100vw",
          height: "100vh",
          backgroundImage: `url(${"wood/wood3.jpg"})`,
          backgroundRepeat: "repeat",
          opacity: 0.8,
        }}
      ></div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <div>tanks</div>
        <div
          style={{
            width: "200px",
            height: "50px",
            backgroundColor: "red",
          }}
        ></div>
      </div>
      {/* <button style={{ color: "red" }}>START</button> */}
      {/* <div> {gameId}</div> */}
      {/* <button */}
      {/*   onClick={async () => { */}
      {/*     try { */}
      {/*       let promptedGameId = prompt("Enter game id"); */}
      {/*       const response = await fetch("http://localhost:5173/join", { */}
      {/*         method: "POST", */}
      {/*         body: JSON.stringify({ gameId: promptedGameId }), */}
      {/*         headers: { */}
      {/*           "Content-Type": "application/json", */}
      {/*         }, */}
      {/*       }); */}
      {/*       const result = await response.json(); */}
      {/*       console.log("Success:", result); */}
      {/*       setGameId(result.gameId); */}
      {/*       setClientId(result.clientId); */}
      {/*     } catch (error) { */}
      {/*       console.error("Error:", error); */}
      {/*     } */}
      {/*   }} */}
      {/* > */}
      {/*   {" "} */}
      {/*   join game{" "} */}
      {/* </button> */}
    </>
  );
};
