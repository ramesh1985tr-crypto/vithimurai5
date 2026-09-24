/*
  Formula Pro — Formula Control Center
  ORDER 2.1 foundation

  PURPOSE:
  - Formula rules/version தனியாக வைத்திருக்கும்.
  - Future formula versions-ஐ manage செய்யும்.
  - Update history வைத்திருக்கும்.
  - பழைய formula-வை rollback செய்யும்.
  - Main calculation engine-ஐ நேரடியாக மாற்றாமல்
    configuration மூலம் control செய்யும்.

  IMPORTANT:
  இந்த file arbitrary JavaScript code-ஐ execute செய்யாது.
*/

window.FORMULA_CONTROL = (() => {

  const STORAGE_KEY = "formula-pro-control-v1";

  const DEFAULT_FORMULA = {
    version: "ORDER 2.1",

    data: {
      windowDays: 10,
      requireExactly10Results: true,
      timeSlotIsolation: true
    },

    pressure: {
      highMin: 4,
      medMin: 2
    },

    hero: {
      enabled: true,
      firstPosition: false
    },

    strongPairs: {
      enabled: true,
      minCount: 2,
      preserveDirection: true
    },

    main6: {
      enabled: true,
      count: 6,
      maxDigitUsage: 2,
      noDoubles: true,
      noDuplicateDigitSet: true,
      requireZeroToNineCoverage: true
    },

    doubles: {
      enabled: true,
      count: 3
    },

    singles: {
      enabled: true,
      count: 2
    },

    safety: {
      noFixedCombos: true,
      noFixedNumbers: true,
      noPreviousOutputReuse: true,
      noCrossTimeDataMixing: true,
      freshCalculation: true
    }
  };


  function clone(value) {

    return JSON.parse(
      JSON.stringify(value)
    );

  }


  function validFormula(f) {

    return !!(
      f &&
      f.version &&
      f.data &&
      Number.isInteger(
        f.data.windowDays
      ) &&
      f.data.windowDays > 0 &&
      f.pressure &&
      Number.isInteger(
        f.pressure.highMin
      ) &&
      Number.isInteger(
        f.pressure.medMin
      ) &&
      f.main6 &&
      Number.isInteger(
        f.main6.count
      ) &&
      Number.isInteger(
        f.main6.maxDigitUsage
      ) &&
      f.doubles &&
      Number.isInteger(
        f.doubles.count
      ) &&
      f.singles &&
      Number.isInteger(
        f.singles.count
      )
    );

  }


  function load() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {

        return {
          active:
            clone(DEFAULT_FORMULA),

          history: []
        };

      }

      const saved =
        JSON.parse(raw);

      if (
        !saved ||
        !validFormula(saved.active) ||
        !Array.isArray(
          saved.history
        )
      ) {

        return {
          active:
            clone(DEFAULT_FORMULA),

          history: []
        };

      }

      return saved;

    }

    catch (e) {

      return {
        active:
          clone(DEFAULT_FORMULA),

        history: []
      };

    }

  }


  function save(state) {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

  }


  function get() {

    return clone(
      load().active
    );

  }


  /*
    Apply a complete formula.

    Old version is automatically
    saved before the new version
    becomes active.
  */

  function apply(
    newFormula,
    reason = "Formula update"
  ) {

    if (
      !validFormula(newFormula)
    ) {

      throw new Error(
        "Invalid formula definition."
      );

    }

    const state =
      load();

    const oldFormula =
      clone(state.active);


    state.history.unshift({

      version:
        oldFormula.version,

      savedAt:
        new Date().toISOString(),

      reason,

      formula:
        oldFormula

    });


    state.active =
      clone(newFormula);


    save(state);


    return {

      oldVersion:
        oldFormula.version,

      newVersion:
        newFormula.version,

      applied:
        true

    };

  }


  /*
    Formula update history.
  */

  function history() {

    return clone(
      load().history
    );

  }


  /*
    Restore an old formula version.
  */

  function rollback(version) {

    const state =
      load();

    const item =
      state.history.find(
        x =>
          x.version === version
      );


    if (!item) {

      throw new Error(
        "Requested formula version was not found."
      );

    }


    const current =
      clone(state.active);


    state.history.unshift({

      version:
        current.version,

      savedAt:
        new Date().toISOString(),

      reason:
        "Rollback",

      formula:
        current

    });


    state.active =
      clone(item.formula);


    save(state);


    return {

      restored:
        state.active.version

    };

  }


  /*
    SAFE COMMAND LAYER

    Only known formula commands are
    accepted here.

    Arbitrary JavaScript is NOT executed.
  */

  function command(commandText) {

    const text =
      String(
        commandText || ""
      )
      .trim()
      .toLowerCase();


    const next =
      get();


    /*
      HERO FIRST POSITION ON
    */

    if (
      text.includes(
        "hero first position on"
      ) ||
      text.includes(
        "hero first position enable"
      )
    ) {

      next.hero.firstPosition =
        true;

    }


    /*
      HERO FIRST POSITION OFF
    */

    else if (
      text.includes(
        "hero first position off"
      ) ||
      text.includes(
        "hero first position disable"
      ) ||
      text.includes(
        "hero first position வேண்டாம்"
      )
    ) {

      next.hero.firstPosition =
        false;

    }


    /*
      DUPLICATE DIGIT-SET ON
    */

    else if (
      text.includes(
        "duplicate digit-set on"
      ) ||
      text.includes(
        "duplicate digit set on"
      )
    ) {

      next.main6.noDuplicateDigitSet =
        true;

    }


    /*
      DUPLICATE DIGIT-SET OFF
    */

    else if (
      text.includes(
        "duplicate digit-set off"
      ) ||
      text.includes(
        "duplicate digit set off"
      )
    ) {

      next.main6.noDuplicateDigitSet =
        false;

    }


    /*
      STRONG PAIR MINIMUM 3
    */

    else if (
      text.includes(
        "strong pair minimum 3"
      )
    ) {

      next.strongPairs.minCount =
        3;

    }


    /*
      STRONG PAIR MINIMUM 2
    */

    else if (
      text.includes(
        "strong pair minimum 2"
      )
    ) {

      next.strongPairs.minCount =
        2;

    }


    else {

      throw new Error(
        "இந்த command இன்னும் supported rule list-ல் இல்லை. Formula Update பகுதியில் rule definition கொடுக்க வேண்டும்."
      );

    }


    /*
      Automatic version increment.
    */

    const oldVersion =
      next.version;

    const parts =
      oldVersion.match(
        /(\d+)\.(\d+)/
      );


    if (parts) {

      next.version =
        "ORDER " +
        parts[1] +
        "." +
        (
          Number(parts[2]) + 1
        );

    }


    return {

      preview:
        next,

      message:
        "Preview மட்டும் உருவாக்கப்பட்டது. APPLY செய்த பிறகே புதிய formula active ஆகும்."

    };

  }


  return {

    defaults:
      clone(DEFAULT_FORMULA),

    get,

    apply,

    history,

    rollback,

    command

  };

})();
